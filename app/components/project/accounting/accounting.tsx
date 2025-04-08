"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, updateDoc, doc as getDocRef, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebase-config";
import { DollarSign, FileText, RotateCcw, CheckCircle, Loader2, Edit2, Plus } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import QuoteCreatorButton from "./quote-creator-button";
import QuoteCreator from "./quote-creator-interface";

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

  // Quote creator states
  const [showQuoteCreator, setShowQuoteCreator] = useState<boolean>(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState<any>(null);

  // Edit dialog states
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
      
      // Fetch company profile for the quote creator
      const profileSnapshot = await getDocs(collection(db, "merchants", userData.merchantCode, "profile"));
      if (!profileSnapshot.empty) {
        const profileData = profileSnapshot.docs[0].data();
        setCompanyData({
          name: profileData.companyName || '',
          address: profileData.address || '',
          city: profileData.city || '',
          postalCode: profileData.postalCode || '',
          email: profileData.companyEmail || '',
          phone: profileData.phoneNumber || '',
          vatNumber: profileData.vatNumber || '',
          logoUrl: profileData.logoUrl || '',
        });
      }
      
      // Fetch vehicle data for the project
      const projectSnapshot = await getDocs(collection(db, "merchants", userData.merchantCode, "projects"));
      const projectDoc = projectSnapshot.docs.find(doc => doc.id === projectId);
      if (projectDoc) {
        const projectData = projectDoc.data();
        if (projectData.vehicle) {
          setVehicleData({
            registration: projectData.vehicle.registration || '',
            make: projectData.vehicle.make || '',
            model: projectData.vehicle.model || '',
            year: projectData.vehicle.year || '',
            mileage: projectData.vehicle.mileage || '',
            vin: projectData.vehicle.vin || '',
          });
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to load documents. Please try again later.");
    } finally {
      setIsFetching(false);
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, [projectId, user]);

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
  
      toast.success("Document amount updated successfully");
    } catch (error) {
      console.error("Error updating document amount:", error);
      toast.error("Failed to update document amount");
    } finally {
      setShowEditDialog(false);
      setDocToEdit(null);
      setEditAmount("");
    }
  };

  // Handle saving a quote
  const handleSaveQuote = async (quoteData: any, asDraft: boolean) => {
    if (!merchantCode) return;
    
    try {
      // Generate a random filename for the PDF
      const timestamp = Date.now();
      const filename = `Quote_${quoteData.quoteNumber}_${timestamp}.pdf`;
      
      // In a real app, you'd generate a PDF from the quote data
      // For demo purposes, we'll create a placeholder PDF
      const pdfBlob = new Blob(['Placeholder for Quote PDF'], { type: 'application/pdf' });
      
      // Upload PDF to Firebase Storage
      const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${filename}`);
      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);
      
      // Save document reference to Firestore
      const docRef = collection(db, "merchants", merchantCode, "projects", projectId, "documents");
      const docType = asDraft ? "Supplier Quote" : "Supplier Invoice";
      
      await addDoc(docRef, {
        fileName: filename,
        url: pdfUrl,
        docType: docType,
        uploadedAt: Timestamp.now(),
        projectId: projectId,
        amount: quoteData.total,
        // Store the quote data for future editing
        quoteData: JSON.stringify(quoteData),
      });
      
      // Refresh documents list
      fetchDocuments();
      
      toast.success(asDraft ? "Quote saved as draft" : "Quote created and saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving quote:", error);
      toast.error("Failed to save quote");
      return false;
    }
  };
  
  // Handle converting a quote to an invoice
  const handleConvertToInvoice = async (quoteData: any) => {
    if (!merchantCode) return;
    
    try {
      // Similar process to saving a quote, but mark as invoice
      const timestamp = Date.now();
      const filename = `Invoice_${quoteData.quoteNumber}_${timestamp}.pdf`;
      
      // Create a placeholder PDF
      const pdfBlob = new Blob(['Placeholder for Invoice PDF'], { type: 'application/pdf' });
      
      // Upload PDF to Firebase Storage
      const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${filename}`);
      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);
      
      // Save document reference to Firestore
      const docRef = collection(db, "merchants", merchantCode, "projects", projectId, "documents");
      
      await addDoc(docRef, {
        fileName: filename,
        url: pdfUrl,
        docType: "Supplier Invoice",
        uploadedAt: Timestamp.now(),
        projectId: projectId,
        amount: quoteData.total,
        // Store the invoice data
        quoteData: JSON.stringify({...quoteData, status: 'invoice'}),
      });
      
      // Refresh documents list
      fetchDocuments();
      
      toast.success("Quote converted to invoice successfully");
      return true;
    } catch (error) {
      console.error("Error converting quote to invoice:", error);
      toast.error("Failed to convert quote to invoice");
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Accounting</h2>
        <QuoteCreatorButton onClick={() => setShowQuoteCreator(true)} />
      </div>

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
              <div className="flex items-center justify-between">
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
                
                {/* Add edit button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(doc)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Amount
                </Button>
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
                className="w-full h-[600px] border rounded"
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
            <Button onClick={handleEditSave} variant="default">
              Save Amount
            </Button>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Creator Dialog */}
      <QuoteCreator
        open={showQuoteCreator}
        onOpenChange={setShowQuoteCreator}
        projectId={projectId}
        companyData={companyData}
        vehicleData={vehicleData}
        onSave={handleSaveQuote}
        onConvertToInvoice={handleConvertToInvoice}
      />
    </div>
  );
};

export default AccountingSection;