"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/app/components/customs/date-picker-with-range";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/firebase-config";
import { Card } from "@/components/ui/card";

// Import dialog components (adjust if needed)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export type AccountingCategory =
  | "Recurring Expenditure"
  | "Contingent Expenses"
  | "Compensation"
  | "Bank Statements"
  | "Income (Remittances)"
  | "Fuel & Maintenance";

export interface AccountingDocument {
  id: string;
  category: AccountingCategory;
  fileName: string;
  url: string;
  uploadedAt: Date;
  amount?: number;
}

const categoryOptions: AccountingCategory[] = [
  "Recurring Expenditure",
  "Contingent Expenses",
  "Compensation",
  "Bank Statements",
  "Income (Remittances)",
  "Fuel & Maintenance",
];

export default function AccountingPage() {
  // Date range state
  const [dateRange, setDateRange] = useState<
    { from: Date; to: Date } | undefined
  >(undefined);
  const [documents, setDocuments] = useState<AccountingDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Centralized upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    AccountingCategory | ""
  >("");

  // New state for dialog
  const [showAmountDialog, setShowAmountDialog] = useState<boolean>(false);
  const [currentDoc, setCurrentDoc] = useState<AccountingDocument | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");

  // Fetch documents from Firestore, filtered by dateRange if provided.
  const fetchDocuments = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "accountingDocuments")
      );
      const docs: AccountingDocument[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<AccountingDocument, "id">;
        const uploadedAt =
          data.uploadedAt && (data.uploadedAt as any).toDate
            ? (data.uploadedAt as any).toDate()
            : new Date(data.uploadedAt);
        if (dateRange) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (uploadedAt >= fromDate && uploadedAt <= toDate) {
            docs.push({ id: docSnap.id, ...data, uploadedAt });
          }
        } else {
          docs.push({ id: docSnap.id, ...data, uploadedAt });
        }
      });
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching accounting documents:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [dateRange?.from, dateRange?.to]);

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !selectedCategory) return;

    setLoading(true);
    try {
      const timestamp = Date.now();
      const ext = selectedFile.name.substring(
        selectedFile.name.lastIndexOf(".")
      );
      const count =
        documents.filter((doc) => doc.category === selectedCategory).length + 1;
      const newFileName = `${selectedCategory} (${count}) - ${timestamp}${ext}`;
      const storageRef = ref(
        storage,
        `accounting/${selectedCategory}/${newFileName}`
      );
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(snapshot.ref);
      const docData = {
        category: selectedCategory,
        fileName: newFileName,
        url,
        uploadedAt: new Date(),
      };
      const docRef = await addDoc(
        collection(db, "accountingDocuments"),
        docData
      );
      const newDoc: AccountingDocument = {
        id: docRef.id,
        ...docData,
        category: selectedCategory,
      };

      // Instead of clearing the form, open the dialog
      setCurrentDoc(newDoc);
      setShowAmountDialog(true);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle confirming the invoice amount
  const handleConfirmAmount = async () => {
    if (!currentDoc) return;
    try {
      const amountValue = parseFloat(invoiceAmount);
      const docRef = doc(db, "accountingDocuments", currentDoc.id);
      await updateDoc(docRef, { amount: amountValue });
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === currentDoc.id ? { ...d, amount: amountValue } : d
        )
      );
      setShowAmountDialog(false);
      setCurrentDoc(null);
      setInvoiceAmount("");
      setSelectedFile(null);
      setSelectedCategory("");
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error updating document with amount:", error);
    }
  };

  // Group documents by category
  const groupedDocs = documents.reduce((acc, doc) => {
    (acc[doc.category] = acc[doc.category] || []).push(doc);
    return acc;
  }, {} as Record<AccountingCategory, AccountingDocument[]>);

  return (
    <div className="space-y-6 p-6">
      {/* Date Range Picker */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <DatePickerWithRange value={dateRange} onSelect={setDateRange} />
      </div>

      {/* Accordion for documents */}
      <div className="space-y-4">
        {categoryOptions.map((category) => {
          const docsForCategory = groupedDocs[category] || [];
          return (
            <Accordion
              key={category}
              type="single"
              collapsible
              className="w-full"
            >
              <AccordionItem value={category}>
                <AccordionTrigger className="flex justify-between items-center">
                  <span>
                    {category} ({docsForCategory.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  {docsForCategory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No documents uploaded for this section.
                    </p>
                  ) : (
                    docsForCategory.map((doc, index) => (
                      <Card key={doc.id} className="p-4 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            {doc.fileName}{" "}
                            {doc.amount !== undefined && `- ${doc.amount}`}
                          </div>
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.url, "_blank")}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                // Implement delete logic here
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
      </div>

      {/* Upload Section */}
      <Card className="p-4">
        <h3 className="text-lg font-medium">Upload New Document</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              className="block mb-2 text-sm font-medium"
              htmlFor="category-select"
            >
              Document Category
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) =>
                setSelectedCategory(value as AccountingCategory)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              className="block mb-2 text-sm font-medium"
              htmlFor="file-upload"
            >
              Select File
            </Label>
            <Input
              id="file-upload"
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={loading || !selectedFile || !selectedCategory}
          >
            {loading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </Card>

      {/* Dialog to prompt for invoice amount and show document */}
      {showAmountDialog && currentDoc && (
        <Dialog open={showAmountDialog} onOpenChange={setShowAmountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Invoice Amount</DialogTitle>
              <DialogDescription>
                Please review the document below and enter the invoice amount.
              </DialogDescription>
            </DialogHeader>
            {/* Iframe to display the document */}
            <div className="mb-4">
              <iframe
                src={currentDoc.url}
                title="Uploaded Document"
                className="w-full h-64 border"
              />
            </div>
            <div className="space-y-4 py-4">
              <Label
                className="block text-sm font-medium"
                htmlFor="invoice-amount"
              >
                Invoice Amount
              </Label>
              <Input
                id="invoice-amount"
                type="number"
                placeholder="Enter amount"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmAmount}>Confirm</Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
