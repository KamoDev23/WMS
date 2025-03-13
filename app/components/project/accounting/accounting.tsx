"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, updateDoc, doc as getDocRef } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { DollarSign, FileText, RotateCcw, CheckCircle, Loader2, Edit2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AccountingStatsGrid } from "../../customs/accounting-stats-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { fetchAccountingDocuments, updateAccountingDocumentAmount } from "@/lib/fetch-accounting-docs";

export interface AccountingDocument {
  id: string;
  docType:
    | "Supplier Quote"
    | "Supplier Invoice"
    | "Repair Quote"
    | "Remittance";
  fileName: string;
  url: string;
  uploadedAt: Date;
  projectId: string;
  amount?: number;
}

// Helper function to format currency as "R 100 000.00"
const formatCurrency = (value: number): string => {
  const formatted = value.toFixed(2); // e.g., "182923.21"
  const [integerPart, decimalPart] = formatted.split(".");
  const spacedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${spacedInteger}.${decimalPart}`;
};

interface AccountingSectionProps {
  projectId: string;
}

export const AccountingSection: React.FC<AccountingSectionProps> = ({ projectId }) => {

  
  const { user } = useAuth();
  const [merchantCode, setMerchantCode] = useState<string | null>(null);

  const [docs, setDocs] = useState<AccountingDocument[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  // New states for editing a document amount
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [docToEdit, setDocToEdit] = useState<AccountingDocument | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  // Fetch accounting-related documents from Firestore
  const fetchDocuments = async () => {
    if (!user) return;
    
    setIsFetching(true);
    setError(null);
    
    try {
      // Fetch user's merchant code
      const userDoc = await getDocs(collection(db, "users"));
      const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();
  
      if (!userData || !userData.merchantCode) {
        console.error("Merchant code not found for user");
        setError("Merchant code not available.");
        return;
      }
  
      setMerchantCode(userData.merchantCode);
      
      // Fetch accounting documents for the merchant's project
      const fetchedDocs = await fetchAccountingDocuments(userData.merchantCode, projectId);
      setDocs(fetchedDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to load documents. Please try again later.");
    } finally {
      setIsFetching(false);
    }
  };
  

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  // Calculations:
  const estimatedExpenditure = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Supplier Quote")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  const totalExpenditure = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Supplier Invoice")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  // Raw invoice amount (before deduction) from Repair Quote documents
  const rawRepairQuote = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Repair Quote")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  const estimatedRemittance = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Repair Quote")
      .reduce((sum, doc) => sum + (doc.amount || 0) * (1 - 0.068999), 0);
  }, [docs]);

  const actualRemittance = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Remittance")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  // Build stats array for use with AccountingStatsGrid.
  const accountingStats = [
    {
      title: "Estimated Expenditure",
      value: `≈ ${formatCurrency(estimatedExpenditure)}`,
      change: { value: "0%", trend: "up" },
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Actual Expenditure",
      value: formatCurrency(totalExpenditure),
      change: { value: "0%", trend: "up" },
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Invoice Amount",
      value: formatCurrency(rawRepairQuote),
      change: { value: "0%", trend: "up" },
      icon: <RotateCcw className="h-5 w-5" />,
    },
    {
      title: "Estimated Remittance",
      value: `≈ ${formatCurrency(estimatedRemittance)}`,
      change: { value: "0%", trend: "up" },
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "Actual Remittance",
      value: formatCurrency(actualRemittance),
      change: { value: "0%", trend: "up" },
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  // Filter documents based on selected filter; if "All", return all docs.
  const filteredDocs = useMemo(() => {
    if (selectedFilter === "All") return docs;
    return docs.filter((doc) => doc.docType === selectedFilter);
  }, [docs, selectedFilter]);

  // Open the edit dialog for a given document
  const openEditDialog = (doc: AccountingDocument) => {
    setDocToEdit(doc);
    setEditAmount(doc.amount ? doc.amount.toString() : "");
    setShowEditDialog(true);
  };

  // Save the updated amount to Firestore and update local state
  const handleEditSave = async () => {
    if (!docToEdit || !merchantCode) return;
    
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount)) return;
  
    try {
      await updateAccountingDocumentAmount(merchantCode, projectId, docToEdit.id, newAmount);
  
      setDocs((prev) =>
        prev.map((doc) =>
          doc.id === docToEdit.id ? { ...doc, amount: newAmount } : doc
        )
      );
  
      console.log("Document amount updated successfully");
    } catch (error) {
      console.error("Error updating document amount:", error);
    } finally {
      setShowEditDialog(false);
      setDocToEdit(null);
      setEditAmount("");
    }
  };
  

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Accounting</h2>

      {/* Totals using AccountingStatsGrid */}
      <AccountingStatsGrid stats={accountingStats} />

      {/* Document Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold mb-2">Document Details</h3>
        <div className="w-48">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Supplier Quote">Supplier Quote</SelectItem>
                <SelectItem value="Supplier Invoice">Supplier Invoice</SelectItem>
                <SelectItem value="Repair Quote">Repair Quote</SelectItem>
                <SelectItem value="Remittance">Remittance</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document List */}
      <div>
        {isFetching ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-muted-foreground">Loading accounting documents...</p>
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredDocs.length === 0 ? (
          <p className="text-muted-foreground">
            No accounting documents uploaded yet.
          </p>
        ) : (
          filteredDocs.map((doc, index) => (
            <Card key={doc.id} className="p-4 mb-4 relative">
              {/* Edit Icon positioned in the top left */}
              {/* <button
                onClick={() => openEditDialog(doc)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200"
                aria-label="Edit document amount"
              >
                <Edit2 className="h-4 w-4" />
              </button> */}
              <div className="flex flex-col space-y-2">
                <div>
                  
                  <p className="text-sm">
                    {doc.fileName}  
                  </p>
                  <p className="text-xs text-muted-foreground">{doc.docType}</p>
                </div>
                <div>
                  <Label className="whitespace-nowrap">
                    Amount: {formatCurrency(doc.amount !== undefined ? doc.amount : 0)}
                  </Label>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Document Amount Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Document Amount</DialogTitle>
            <DialogDescription>
              Update the amount for this document.
            </DialogDescription>
          </DialogHeader>
          {docToEdit && (
            <div className="mb-4">
              <iframe
                src={docToEdit.url}
                className="w-full h-[800px] border rounded"
                title="Document Preview"
              />
            </div>
          )}
          <div className="grid gap-4 py-4">
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              type="number"
              placeholder="0.00"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <button
              onClick={handleEditSave}
              className="rounded bg-blue-500 px-4 py-2 text-white"
            >
              Save Amount
            </button>
            <DialogClose asChild>
              <button className="rounded border px-4 py-2">Cancel</button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingSection;
