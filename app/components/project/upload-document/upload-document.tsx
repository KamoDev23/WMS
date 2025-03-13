"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
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
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useCustomToast } from "../../customs/toast";
import { Loader2, FileText, DollarSign, ShieldCheckIcon, CheckCircle, BellIcon, LifeBuoy as LifeBuoyIcon, Image, File, Cog, Wrench, FileCheck2, FileCog, HandCoins } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  deleteDocument,
  fetchDocumentsForProject,
  updateDocument,
  uploadDocument,
} from "@/lib/project-documents";

export interface UploadedDocument {
  id: string;
  docType: string;
  fileName: string;
  url: string;
  uploadedAt: Date;
  projectId: string;
  amount?: number;
  // Field to keep history of previous version (if updated)
  previousVersion?: {
    fileUrl: string;
    amount: number;
  };
}

interface UploadDocumentsSectionProps {
  projectId: string;
}

// Helper function to format currency as "R 100 000.00"
const formatCurrency = (value: number): string => {
  const formatted = value.toFixed(2);
  const [integerPart, decimalPart] = formatted.split(".");
  const spacedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${spacedInteger}.${decimalPart}`;
};

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

// Mapping of document types to icons
const docTypeIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  "Supplier Quote": FileText,
  "Supplier Invoice": DollarSign,
  "Repair Quote": Cog,
  "Pre-auth Form": ShieldCheckIcon,
  "Purchase Order Form": FileCog,
  "Authorisation Form": FileCheck2,
  "Repair Invoice": Wrench,
  "Remittance": HandCoins,
  "Vehicle Photos": Image,
  "Other": File,
};

export const UploadDocumentsSection: React.FC<UploadDocumentsSectionProps> = ({ projectId }) => {
  const showToast = useCustomToast();
  const { user } = useAuth();
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("Supplier Quote");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);

  // New state for amount dialog (after upload)
  const [showAmountDialog, setShowAmountDialog] = useState<boolean>(false);
  const [currentUploadedDoc, setCurrentUploadedDoc] = useState<UploadedDocument | null>(null);
  const [docAmount, setDocAmount] = useState<string>("");

  // New state for download dialog
  const [downloadDialogOpen, setDownloadDialogOpen] = useState<boolean>(false);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<string>>(new Set());

  // NEW STATES for Delete & Update actions
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; fileName: string } | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState<boolean>(false);
  const [docToUpdate, setDocToUpdate] = useState<UploadedDocument | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateAmount, setUpdateAmount] = useState<string>("");

  // NEW STATES for Edit dialog (to update amount for any document)
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [docToEdit, setDocToEdit] = useState<UploadedDocument | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  // Group documents by docType
  const groupedDocs = uploadedDocs.reduce((acc, doc) => {
    (acc[doc.docType] = acc[doc.docType] || []).push(doc);
    return acc;
  }, {} as Record<string, UploadedDocument[]>);

  // Upload file to Firebase Storage and save metadata in Firestore with sequential numbering
  const handleUpload = async () => {
    if (!selectedFile || !merchantCode) return;
    setLoading(true);
    
    try {
      const requiresAmount = ["Supplier Quote", "Supplier Invoice", "Repair Quote", "Repair Invoice", "Remittance"].includes(docType);
      const newDoc = await uploadDocument(merchantCode, projectId, selectedFile, docType, requiresAmount ? 0 : undefined);
      
      if (newDoc) {
        setUploadedDocs((prev) => [...prev, newDoc]);
  
        if (requiresAmount) {
          setCurrentUploadedDoc(newDoc);
          setShowAmountDialog(true);
        } else {
          showToast({ message: "Document uploaded successfully" });
        }
      }
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };
  
  // Update document with the entered amount (post-upload)
  const handleAmountSave = async () => {
    if (!currentUploadedDoc || !merchantCode) return;
    const amountValue = parseFloat(docAmount);
    if (isNaN(amountValue)) return;

    setLoading(true);
    try {
      const docRef = doc(db, "merchants", merchantCode, "projects", projectId, "documents", currentUploadedDoc.id);
      await updateDoc(docRef, { amount: amountValue });

      setUploadedDocs((prev) =>
        prev.map((doc) =>
          doc.id === currentUploadedDoc.id ? { ...doc, amount: amountValue } : doc
        )
      );
      showToast({ message: "Document amount saved successfully" });
    } catch (error) {
      console.error("Error saving document amount:", error);
    } finally {
      setLoading(false);
      setShowAmountDialog(false);
      setDocAmount("");
      setCurrentUploadedDoc(null);
    }
  };

  // Opens the edit dialog and pre-fills the current amount
  const openEditDialog = (recordId: string) => {
    const docRecord = uploadedDocs.find((doc) => doc.id === recordId);
    if (docRecord) {
      setDocToEdit(docRecord);
      setEditAmount(docRecord.amount?.toString() || "");
      setShowEditDialog(true);
    }
  };

  const handleEditSave = async () => {
    if (!docToEdit || !merchantCode) return;
    const amountValue = parseFloat(editAmount);
    if (isNaN(amountValue)) return;
  
    setLoading(true);
    try {
      const docRef = doc(db, "merchants", merchantCode, "projects", projectId, "documents", docToEdit.id);
      await updateDoc(docRef, { amount: amountValue });
  
      setUploadedDocs((prev) =>
        prev.map((doc) =>
          doc.id === docToEdit.id ? { ...doc, amount: amountValue } : doc
        )
      );
      showToast({ message: "Document amount updated successfully" });
    } catch (error) {
      console.error("Error updating document amount:", error);
    } finally {
      setLoading(false);
      setShowEditDialog(false);
      setDocToEdit(null);
      setEditAmount("");
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
          docs.push({ id: docSnap.id, ...data });
        }
      });
      setUploadedDocs(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
  
    const fetchDocs = async () => {
      setLoadingDocs(true)
      try {
        // Fetch user's merchant code
        const userDoc = await getDocs(collection(db, "users"));
        const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();
        if (!userData || !userData.merchantCode) {
          console.error("Merchant code not found.");
          return;
        }
  
        setMerchantCode(userData.merchantCode);
        const docs = await fetchDocumentsForProject(userData.merchantCode, projectId);
        setUploadedDocs(docs);
        setLoadingDocs(false);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };
  
    fetchDocs();
  }, [user, projectId]);
  
  // Delete document from Storage and Firestore
  const handleDelete = async (docId: string, fileName: string) => {
    if (!merchantCode || !projectId) return;
    setLoading(true);
  
    try {
      // Reference to the file in Firebase Storage
      const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${fileName}`);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, "merchants", merchantCode, "projects", projectId, "documents", docId));

      // Update state
      setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));

      showToast({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast({ message: "Error deleting document" });
    } finally {
      setLoading(false);
    }
  };

  // Opens the delete confirmation dialog
  const openDeleteDialog = (docId: string, fileName: string) => {
    setDocToDelete({ id: docId, fileName });
    setShowDeleteDialog(true);
  };

  // Open update dialog for Repair Quote or Pre-auth Form document
  const openUpdateDialog = (doc: UploadedDocument) => {
    setDocToUpdate(doc);
    setShowUpdateDialog(true);
  };

  // Confirm update: upload new file & update amount (if Repair Quote). Overrides the document’s current values while keeping the old version.
  const handleUpdateConfirm = async () => {
    if (!docToUpdate || !merchantCode) return;
    setLoading(true);
    try {
      await updateDocument(merchantCode, projectId, docToUpdate.id, updateFile, parseFloat(updateAmount));
      showToast({ message: "Document updated successfully" });
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      setLoading(false);
      setShowUpdateDialog(false);
      setDocToUpdate(null);
    }
  };
  
  // Drag and drop functionality using react-dropzone for upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  // Drag and drop for update dialog
  const onDropUpdate = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUpdateFile(acceptedFiles[0]);
    }
  }, [setUpdateFile]);
  
  const {
    getRootProps: getUpdateRootProps,
    getInputProps: getUpdateInputProps,
    isDragActive: isUpdateDragActive,
  } = useDropzone({
    onDrop: onDropUpdate,
    multiple: false,
  });
  
  // Toggle selection for download
  const toggleDownloadSelection = (docId: string) => {
    setSelectedForDownload((prev) => {
      const copy = new Set(prev);
      if (copy.has(docId)) {
        copy.delete(docId);
      } else {
        copy.add(docId);
      }
      return copy;
    });
  };

  // Download selected documents as a zip
  const handleDownloadZip = async () => {
    if (selectedForDownload.size === 0) return;
    const zip = new JSZip();
    const folder = zip.folder(projectId);
    const docsToDownload = uploadedDocs.filter((doc) =>
      selectedForDownload.has(doc.id)
    );
  
    for (const doc of docsToDownload) {
      try {
        const response = await fetch(doc.url);
        if (!response.ok) {
          console.error(`Error fetching file ${doc.fileName}: ${response.statusText}`);
          continue;
        }
        const blob = await response.blob();
        if (blob.size > 0) {
          folder?.file(doc.fileName, blob);
        } else {
          console.error(`File ${doc.fileName} returned an empty blob.`);
        }
      } catch (error) {
        console.error(`Error fetching file ${doc.fileName}:`, error);
      }
    }
    
    zip.generateAsync({ type: "blob" }).then((content) => {
      if (content.size > 0) {
        saveAs(content, `${projectId}.zip`);
      } else {
        console.error("ZIP archive is empty.");
      }
    });
    
    setDownloadDialogOpen(false);
    setSelectedForDownload(new Set());
  };

  // New simple view handler – opens the document in a new tab
  const handleView = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Uploaded Documents displayed in Accordions */}
      <div>
      <h2 className="text-xl font-bold mb-2">Uploaded Documents</h2>
        {loadingDocs ? (
                  <div className="flex items-center space-x-2 py-10">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p className="text-muted-foreground">Loading accounting documents...</p>
                  </div>
                ) : uploadedDocs.length === 0 ? (
                  <p className="text-muted-foreground">
                    No accounting documents uploaded yet.
                  </p>
                ) : (
          <>
            <div className="space-y-4">
              {docTypeOptions.map((type) => {
                const docsForType = groupedDocs[type] || [];
                if (docsForType.length === 0) return null;
                // Flatten each document into one or two entries.
                const docEntries = docsForType.flatMap((doc) => {
                  const entries = [
                    {
                      recordId: doc.id,
                      version: "current",
                      fileName: doc.fileName,
                      url: doc.url,
                      docType: doc.docType,
                      amount: doc.amount,
                    },
                  ];
                  if (doc.previousVersion) {
                    entries.push({
                      recordId: doc.id,
                      version: "previous",
                      fileName: `${doc.fileName} (old)`,
                      url: doc.previousVersion.fileUrl,
                      docType: doc.docType,
                      amount: doc.previousVersion.amount,
                    });
                  }
                  return entries;
                });
                const IconComponent = docTypeIcons[type] || FileText;
                return (
                  <Accordion key={type} type="single" collapsible className="w-full">
                    <AccordionItem value={type}>
                      <AccordionTrigger className="flex justify-between items-center">
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                            <IconComponent size={16} />
                          </span>
                          <span>{type} ({docEntries.length})</span>
                        </span>
                       </AccordionTrigger>
                      <AccordionContent >
                        {docEntries.map((entry) => (
                          <Card key={`${entry.recordId}-${entry.version}`} className="p-4 mb-2 ">
                            <div className="flex justify-between items-center space-y-2">
                              <div className="flex flex-col space-y-2">
                                              <div>
                                                
                                                <p className="text-sm mb-1">
                                                  {entry.fileName}  
                                                </p>
                                                <p className="text-xs text-muted-foreground">{entry.docType}</p>
                                              </div>
                                              <div>
                                                {entry.amount !== undefined && (
                                                  
                                                <Label className="whitespace-nowrap">
                                                  Amount: {formatCurrency(entry.amount !== undefined ? entry.amount : 0)}
                                                </Label>
                                                )}
                                              </div>
                                            </div>
                              <div className="space-x-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      Options
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleView(entry.url)}>
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openEditDialog(entry.recordId)}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => openDeleteDialog(entry.recordId, entry.fileName)}>
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
            <div className="flex justify-end">
            <Button
              className="mt-5"
              type="button"
              variant="default"
              onClick={() => setDownloadDialogOpen(true)}
            >
              Download Documents
            </Button>
            </div>
          </>
          
        )}
      </div>

      {/* Upload New Document Section */}
      <Card className="p-4 mt-6">
        <h3 className="text-lg font-medium">Upload New Document</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="block mb-2 text-sm font-medium" htmlFor="category-select">
              Document Category
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
            {selectedFile && (
              <p className="ml-1 mt-2 text-sm text-green-600">
                File selected: {selectedFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Full width drop zone */}
        <div
          {...getRootProps()}
          className={`flex h-52 w-full items-center justify-center rounded border-2 border-dashed p-4 ${isDragActive ? "bg-gray-100" : ""}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the file here ...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Drag &amp; drop a file here, or click to select one.
            </p>
          )}
        </div>

        <div className="flex justify-end ">
          <Button size="sm" onClick={handleUpload} disabled={loading || !selectedFile || !docType}>
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              "Upload Document"
            )}
          </Button>
        </div>
      </Card>

      {/* Dialog for entering document amount after upload */}
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
            <Button onClick={handleAmountSave} disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : "Save Amount"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden">
            Download Documents
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Documents to Download</DialogTitle>
            <DialogDescription>
              Choose the documents you want to include in the ZIP file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {uploadedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedForDownload.has(doc.id)}
                  onChange={() => toggleDownloadSelection(doc.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{doc.fileName}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleDownloadZip}>Download ZIP</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={async () => {
              if (!docToDelete || !merchantCode) return;
              setLoading(true);
              try {
                await handleDelete(docToDelete.id, docToDelete.fileName);
              } catch (error) {
                console.error("Error deleting document:", error);
              } finally {
                setLoading(false);
                setShowDeleteDialog(false);
                setDocToDelete(null);
              }
            }} disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Repair Quote / Pre-auth Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Update {docToUpdate?.docType}
            </DialogTitle>
            <DialogDescription>
              {docToUpdate?.docType === "Repair Quote"
                ? "Upload the new document and enter the new amount."
                : "Upload the new document."}
            </DialogDescription>
          </DialogHeader>
          {/* Drag and Drop Zone for File Upload */}
          <div
            {...getUpdateRootProps()}
            className={`border-2 border-dashed p-4 mt-2 rounded ${isUpdateDragActive ? "bg-gray-100" : ""}`}
          >
            <input {...getUpdateInputProps()} />
            {updateFile ? (
              <p>File selected: {updateFile.name}</p>
            ) : isUpdateDragActive ? (
              <p>Drop the file here...</p>
            ) : (
              <p>Drag & drop a file here, or click to select one.</p>
            )}
          </div>
          {docToUpdate?.docType === "Repair Quote" && (
            <Input
              type="number"
              placeholder="New Amount"
              value={updateAmount}
              onChange={(e) => setUpdateAmount(e.target.value)}
              className="mt-2"
            />
          )}
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleUpdateConfirm} disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Please review the document below and update the amount.
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
            <Button onClick={handleEditSave} disabled={loading}>
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : "Save Amount"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadDocumentsSection;
