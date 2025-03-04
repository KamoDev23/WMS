"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { storage, db } from "@/firebase/firebase-config";
import { Card } from "@/components/ui/card";

export interface UploadedDocument {
  id: string;
  docType: string;
  fileName: string;
  url: string;
  uploadedAt: Date;
  projectId: string;
  amount?: number;
}

interface UploadDocumentsSectionProps {
  projectId: string;
}

export const UploadDocumentsSection: React.FC<UploadDocumentsSectionProps> = ({
  projectId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("Supplier Quote");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAmountDialog, setShowAmountDialog] = useState<boolean>(false);
  const [currentUploadedDoc, setCurrentUploadedDoc] =
    useState<UploadedDocument | null>(null);
  const [docAmount, setDocAmount] = useState<string>("");

  const docTypeOptions: string[] = [
    "Supplier Quote",
    "Supplier Invoice",
    "Repair Quote",
    "Pre-auth Form",
    "Purchase Order Form",
    "Authorisation Form",
    "Repair Invoice",
    "Remittance",
    "Vehicle Photos",
    "Other",
  ];

  // Group documents by docType
  const groupedDocs = uploadedDocs.reduce((acc, doc) => {
    (acc[doc.docType] = acc[doc.docType] || []).push(doc);
    return acc;
  }, {} as Record<string, UploadedDocument[]>);

  // Upload file to Firebase Storage and save metadata in Firestore with sequential numbering
  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const timestamp = Date.now();
      const ext = selectedFile.name.substring(
        selectedFile.name.lastIndexOf(".")
      );
      // Count existing docs for the same type
      const existingDocs = uploadedDocs.filter(
        (d) => d.docType === docType
      ).length;
      const count = existingDocs + 1;
      const newFileName = `${projectId} - ${docType} (${count})${ext}`;

      const storageRef = ref(
        storage,
        `projects/${projectId}/documents/${newFileName}`
      );

      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docData = {
        projectId,
        docType,
        fileName: newFileName,
        url: downloadURL,
        uploadedAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "projectDocuments"), docData);
      const newDoc: UploadedDocument = { id: docRef.id, ...docData };
      setUploadedDocs((prev) => [...prev, newDoc]);

      // For specific document types, prompt for an amount
      if (
        [
          "Supplier Quote",
          "Supplier Invoice",
          "Repair Quote",
          "Remittance",
        ].includes(docType)
      ) {
        setCurrentUploadedDoc(newDoc);
        setShowAmountDialog(true);
      }

      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update document with the entered amount
  const handleAmountSave = async () => {
    if (!currentUploadedDoc) return;
    const amountValue = parseFloat(docAmount);
    if (isNaN(amountValue)) return;
    try {
      const docRef = doc(db, "projectDocuments", currentUploadedDoc.id);
      await updateDoc(docRef, { amount: amountValue });
      setUploadedDocs((prev) =>
        prev.map((doc) =>
          doc.id === currentUploadedDoc.id
            ? { ...doc, amount: amountValue }
            : doc
        )
      );
    } catch (error) {
      console.error("Error saving document amount:", error);
    } finally {
      setShowAmountDialog(false);
      setDocAmount("");
      setCurrentUploadedDoc(null);
    }
  };

  // Fetch uploaded documents for this project from Firestore
  const fetchDocuments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "projectDocuments"));
      const docs: UploadedDocument[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<UploadedDocument, "id">;
        if (data.projectId === projectId) {
          // Convert uploadedAt if necessary
          const uploadedAt =
            data.uploadedAt && (data.uploadedAt as any).toDate
              ? (data.uploadedAt as any).toDate()
              : new Date(data.uploadedAt);
          docs.push({ id: docSnap.id, ...data, uploadedAt });
        }
      });
      setUploadedDocs(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  // Delete document from Storage and Firestore
  const handleDelete = async (docId: string, fileName: string) => {
    try {
      const storageRef = ref(
        storage,
        `projects/${projectId}/documents/${fileName}`
      );
      await deleteObject(storageRef);
      await deleteDoc(doc(db, "projectDocuments", docId));
      setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  // Open preview in a dialog (or drawer)
  const handleView = (url: string) => {
    setPreviewUrl(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Upload Documents</h2>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Input
          id="fileUpload"
          type="file"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setSelectedFile(e.target.files[0]);
            }
          }}
        />
      </div>
      <div className="w-full max-w-sm">
        <Label htmlFor="docType" className="mb-1 mt-2 block">
          Document Type
        </Label>
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {docTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="mr-4"
        variant="outline"
        onClick={handleUpload}
        disabled={loading || !selectedFile}
      >
        {loading ? "Uploading..." : "Upload Document"}
      </Button>

      {/* Dialog for entering document amount with preview */}
      <Dialog open={showAmountDialog} onOpenChange={setShowAmountDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden">
            Enter Amount
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enter Document Amount</DialogTitle>
            <DialogDescription>
              Please review the document below and enter its amount.
            </DialogDescription>
          </DialogHeader>
          {currentUploadedDoc && (
            <div className="mb-4">
              <iframe
                src={currentUploadedDoc.url}
                className="w-full h-[800px] border rounded"
                title="Document Preview"
              />
            </div>
          )}
          <div className="grid gap-4 py-4">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={docAmount}
              onChange={(e) => setDocAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAmountSave}>Save Amount</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accordion for each accounting category */}
      <div className="space-y-4">
        {docTypeOptions.map((category) => {
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
                            {doc.fileName} ({index + 1}){" "}
                            {doc.amount !== undefined && (
                              <span className="ml-2">
                                - {doc.amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(doc.url)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(doc.id, doc.fileName)}
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
    </div>
  );
};

export default UploadDocumentsSection;
