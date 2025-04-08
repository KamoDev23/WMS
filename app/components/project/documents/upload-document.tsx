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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  FileText,
  DollarSign,
  ShieldCheckIcon,
  CheckCircle,
  BellIcon,
  LifeBuoy as LifeBuoyIcon,
  Image,
  File,
  Cog,
  Wrench,
  FileCheck2,
  FileCog,
  HandCoins,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  deleteDocument,
  fetchDocumentsForProject,
  updateDocument,
  uploadDocument,
} from "@/lib/project-documents";
import { ref, uploadBytes, getDownloadURL, deleteObject, getBlob } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { storage, db } from "@/firebase/firebase-config";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useCustomToast } from "../../customs/toast";
import { Separator } from "@/components/ui/separator";
import FullscreenDocumentViewer from "../../business/components/fullscreen-document-viewer";


// ----- Types and Utilities -----

export interface UploadedDocument {
  id: string;
  docType: string;
  fileName: string;
  url: string;
  uploadedAt: Date;
  projectId: string;
  amount?: number;
  previousVersion?: {
    fileUrl: string;
    amount: number;
  };
}

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

// ----- Subcomponents -----

interface DocumentListProps {
  uploadedDocs: UploadedDocument[];
  onView: (doc: UploadedDocument) => void;
  onDownload: (doc: UploadedDocument) => void;
  onEditAmount: (recordId: string) => void;
  onUpdateFile: (doc: UploadedDocument) => void;
  onDelete: (docId: string, fileName: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  uploadedDocs,
  onView,
  onDownload,
  onEditAmount,
  onUpdateFile,
  onDelete,
}) => {
  // Group documents by docType
  const groupedDocs = uploadedDocs.reduce((acc, doc) => {
    (acc[doc.docType] = acc[doc.docType] || []).push(doc);
    return acc;
  }, {} as Record<string, UploadedDocument[]>);

  return (
    <>
      {docTypeOptions.map((type) => {
        const docsForType = groupedDocs[type] || [];
        if (docsForType.length === 0) return null;

        // Flatten each document into current/previous entries
        const docEntries = docsForType.flatMap((doc) => {
          const entries = [
            {
              recordId: doc.id,
              version: "current",
              fileName: doc.fileName,
              url: doc.url,
              docType: doc.docType,
              amount: doc.amount,
              doc: doc,
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
              doc: doc,
            });
          }
          return entries;
        });

        const IconComponent = docTypeIcons[type] || FileText;

        return (
          <Accordion key={type} type="single" collapsible className="w-full px-8">
            <AccordionItem value={type}>
              <AccordionTrigger className="flex justify-between items-center">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                    <IconComponent size={16} />
                  </span>
                  <span>
                    {type} ({docEntries.length})
                  </span>
                </span>
                
              </AccordionTrigger>
              <AccordionContent>
                {docEntries.map((entry) => (
                  <Card key={`${entry.recordId}-${entry.version}`} className="mb-1 bg-sidebar">
                    <CardContent className=" ">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col space-y-2">
                          <div>
                            <p className="text-sm mb-1">{entry.fileName}</p>
                            <p className="text-xs text-muted-foreground">{entry.docType}</p>
                          </div>
                          {entry.amount !== undefined && (
                            <Label className="whitespace-nowrap">
                              Amount: {formatCurrency(entry.amount)}
                            </Label>
                          )}
                        </div>
                        <div className="space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                Options
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => onView(entry.doc)}>
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onDownload(entry.doc)}>
                                Download
                              </DropdownMenuItem>
                              {entry.version === "current" && (
                                <>
                                  <DropdownMenuItem onSelect={() => onEditAmount(entry.recordId)}>
                                    Edit Amount
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => onUpdateFile(entry.doc)}>
                                    Update File
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => onDelete(entry.recordId, entry.fileName)}>
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
            <div className="px-48">
             
            </div>
          </Accordion>
        );
      })}
    </>
  );
};

interface UploadNewDocumentProps {
  docType: string;
  setDocType: (value: string) => void;
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  loading: boolean;
}

const UploadNewDocument: React.FC<UploadNewDocumentProps> = ({
  docType,
  setDocType,
  selectedFile,
  onFileSelect,
  onUpload,
  loading,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    multiple: false,
  });

  return (
    <Card className="p-10 mt-6">
      <CardHeader>
            <CardTitle>Upload New Documents</CardTitle>
            <CardDescription>Select document type and choose the file</CardDescription>
           </CardHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
        <div>
          <Label className="mb-2" htmlFor="category-select">Document Category</Label>
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
            <p className="ml-1 mt-2 text-sm text-green-600">File selected: {selectedFile.name}</p>
          )}
        </div>
      </div>
      <div
        {...getRootProps()}
        className={`flex h-52 w-full items-center justify-center rounded border-2 border-dashed p-4 mt-4 ${
          isDragActive ? "bg-gray-100" : ""
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the file here ...</p> : <p className="text-sm text-muted-foreground">Drag & drop a file here, or click to select one.</p>}
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={onUpload} disabled={loading || !selectedFile || !docType}>
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
  );
};

interface AmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: UploadedDocument | null;
  docAmount: string;
  onAmountChange: (value: string) => void;
  onSave: () => void;
  loading: boolean;
}
const AmountDialog: React.FC<AmountDialogProps> = ({
  open,
  onOpenChange,
  doc,
  docAmount,
  onAmountChange,
  onSave,
  loading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enter Document Amount</DialogTitle>
          <DialogDescription>Please review the document below and enter its amount.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          {doc && (
            <div className="mb-4">
              <iframe src={doc.url} className="w-full h-[400px] border rounded" title="Document Preview" />
            </div>
          )}
          <div className="grid gap-4 py-4">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" placeholder="0.00" value={docAmount} onChange={(e) => onAmountChange(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={loading}>
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Amount"
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docs: UploadedDocument[];
  selectedForDownload: Set<string>;
  toggleDownloadSelection: (docId: string) => void;
  selectAllForDownload: () => void;
  downloadProgress: number;
  downloadingFiles: boolean;
  downloadErrors: string[];
  onDownload: () => void;
}

const DownloadDialog: React.FC<DownloadDialogProps> = ({
  open,
  onOpenChange,
  docs,
  selectedForDownload,
  toggleDownloadSelection,
  selectAllForDownload,
  downloadProgress,
  downloadingFiles,
  downloadErrors,
  onDownload,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Documents to Download</DialogTitle>
          <DialogDescription>Choose the documents you want to include in the ZIP file.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="select-all"
              checked={selectedForDownload.size === docs.length && docs.length > 0}
              onCheckedChange={selectAllForDownload}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All
            </Label>
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`doc-${doc.id}`}
                  checked={selectedForDownload.has(doc.id)}
                  onCheckedChange={() => toggleDownloadSelection(doc.id)}
                />
                <Label htmlFor={`doc-${doc.id}`} className="text-sm">
                  {doc.fileName}
                </Label>
              </div>
            ))}
          </div>
          {downloadingFiles && (
            <div className="space-y-2 mt-4">
              <p className="text-sm">Downloading files: {Math.round(downloadProgress)}%</p>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}
          {downloadErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Download Errors</AlertTitle>
              <AlertDescription>
                <p>Some files couldn't be downloaded:</p>
                <ul className="list-disc pl-5 mt-2 text-sm">
                  {downloadErrors.map((fileName, index) => (
                    <li key={index}>{fileName}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onDownload} disabled={downloadingFiles || selectedForDownload.size === 0}>
            {downloadingFiles ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              "Download ZIP"
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" disabled={downloadingFiles}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>Are you sure you want to delete this document?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface UpdateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: UploadedDocument | null;
  updateFile: File | null;
  onFileSelect: (file: File) => void;
  updateAmount: string;
  onUpdateAmountChange: (value: string) => void;
  onConfirm: () => void;
  loading: boolean;
}

const UpdateDocumentDialog: React.FC<UpdateDocumentDialogProps> = ({
  open,
  onOpenChange,
  doc,
  updateFile,
  onFileSelect,
  updateAmount,
  onUpdateAmountChange,
  onConfirm,
  loading,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    multiple: false,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Update {doc?.docType}</DialogTitle>
          <DialogDescription>Upload a new version of this document.</DialogDescription>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-4 mt-2 rounded flex items-center justify-center h-40 ${
            isDragActive ? "bg-gray-100" : ""
          }`}
        >
          <input {...getInputProps()} />
          {updateFile ? (
            <p className="text-sm">File selected: {updateFile.name}</p>
          ) : isDragActive ? (
            <p className="text-sm">Drop the file here...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Drag & drop a file here, or click to select one.
            </p>
          )}
        </div>
        {doc &&
          ["Supplier Quote", "Supplier Invoice", "Repair Quote", "Repair Invoice", "Remittance"].includes(doc.docType) && (
            <div className="mt-4">
              <Label htmlFor="update-amount">Amount</Label>
              <Input
                id="update-amount"
                type="number"
                placeholder="0.00"
                value={updateAmount}
                onChange={(e) => onUpdateAmountChange(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={onConfirm} disabled={loading || !updateFile}>
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              "Update Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EditDocumentAmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: UploadedDocument | null;
  editAmount: string;
  onEditAmountChange: (value: string) => void;
  onSave: () => void;
  loading: boolean;
}

const EditDocumentAmountDialog: React.FC<EditDocumentAmountDialogProps> = ({
  open,
  onOpenChange,
  doc,
  editAmount,
  onEditAmountChange,
  onSave,
  loading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Document Amount</DialogTitle>
          <DialogDescription>Update the amount for this document.</DialogDescription>
        </DialogHeader>
        {doc && (
          <div className="mb-4">
            <iframe src={doc.url} className="w-full h-96 border rounded" title="Document Preview" />
          </div>
        )}
        <div className="grid gap-4 py-4">
          <Label htmlFor="edit-amount">Amount</Label>
          <Input id="edit-amount" type="number" placeholder="0.00" value={editAmount} onChange={(e) => onEditAmountChange(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={loading}>
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Amount"
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ----- Parent Component -----

const UploadDocumentsSection: React.FC<{ projectId: string }> = ({ projectId }) => {
  const showToast = useCustomToast();
  const { user } = useAuth();
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("Supplier Quote");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);

  // Dialog and selection states
  const [showAmountDialog, setShowAmountDialog] = useState<boolean>(false);
  const [currentUploadedDoc, setCurrentUploadedDoc] = useState<UploadedDocument | null>(null);
  const [docAmount, setDocAmount] = useState<string>("");
  const [downloadDialogOpen, setDownloadDialogOpen] = useState<boolean>(false);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadingFiles, setDownloadingFiles] = useState<boolean>(false);
  const [downloadErrors, setDownloadErrors] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; fileName: string } | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState<boolean>(false);
  const [docToUpdate, setDocToUpdate] = useState<UploadedDocument | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateAmount, setUpdateAmount] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [docToEdit, setDocToEdit] = useState<UploadedDocument | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
const [viewingDocumentName, setViewingDocumentName] = useState<string>("");
const [fullscreenViewerOpen, setFullscreenViewerOpen] = useState(false);

// Replace the handleView function with this new version
const handleView = (doc: UploadedDocument) => {
  if (!merchantCode) return;
  
  const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${doc.fileName}`);
  getDownloadURL(storageRef)
    .then((url) => {
      setViewingDocumentUrl(url);
      setViewingDocumentName(doc.fileName);
      setFullscreenViewerOpen(true);
    })
    .catch((error) => {
      console.error("Error getting download URL:", error);
      showToast({ message: "Error opening document" });
    });
};

  // --- Handlers for Upload, Edit, Delete, Update, Download ---

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
      showToast({ message: "Error uploading document" });
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  const handleAmountSave = async () => {
    if (!currentUploadedDoc || !merchantCode) return;
    const amountValue = parseFloat(docAmount);
    if (isNaN(amountValue)) return;
    setLoading(true);
    try {
      const docRef = doc(db, "merchants", merchantCode, "projects", projectId, "documents", currentUploadedDoc.id);
      await updateDoc(docRef, { amount: amountValue });
      setUploadedDocs((prev) =>
        prev.map((doc) => (doc.id === currentUploadedDoc.id ? { ...doc, amount: amountValue } : doc))
      );
      showToast({ message: "Document amount saved successfully" });
    } catch (error) {
      console.error("Error saving document amount:", error);
      showToast({ message: "Error saving document amount" });
    } finally {
      setLoading(false);
      setShowAmountDialog(false);
      setDocAmount("");
      setCurrentUploadedDoc(null);
    }
  };

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
        prev.map((doc) => (doc.id === docToEdit.id ? { ...doc, amount: amountValue } : doc))
      );
      showToast({ message: "Document amount updated successfully" });
    } catch (error) {
      console.error("Error updating document amount:", error);
      showToast({ message: "Error updating document amount" });
    } finally {
      setLoading(false);
      setShowEditDialog(false);
      setDocToEdit(null);
      setEditAmount("");
    }
  };

  const handleDelete = async () => {
    if (!merchantCode || !projectId || !docToDelete) return;
    setLoading(true);
    try {
      await deleteDocument(merchantCode, projectId, docToDelete.id, docToDelete.fileName);
      setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docToDelete.id));
      showToast({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast({ message: "Error deleting document" });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
      setDocToDelete(null);
    }
  };

  const openDeleteDialog = (docId: string, fileName: string) => {
    setDocToDelete({ id: docId, fileName });
    setShowDeleteDialog(true);
  };

  const openUpdateDialog = (doc: UploadedDocument) => {
    setDocToUpdate(doc);
    setUpdateAmount(doc.amount?.toString() || "");
    setShowUpdateDialog(true);
  };

  const handleUpdateConfirm = async () => {
    if (!docToUpdate || !merchantCode || !updateFile) return;
    setLoading(true);
    try {
      const amountValue = parseFloat(updateAmount);
      const requiresAmount = ["Supplier Quote", "Supplier Invoice", "Repair Quote", "Repair Invoice", "Remittance"].includes(docToUpdate.docType);
      await updateDocument(
        merchantCode,
        projectId,
        docToUpdate.id,
        updateFile,
        !isNaN(amountValue) && requiresAmount ? amountValue : undefined
      );
      const docs = await fetchDocumentsForProject(merchantCode, projectId);
      setUploadedDocs(docs);
      showToast({ message: "Document updated successfully" });
    } catch (error) {
      console.error("Error updating document:", error);
      showToast({ message: "Error updating document" });
    } finally {
      setLoading(false);
      setShowUpdateDialog(false);
      setDocToUpdate(null);
      setUpdateFile(null);
      setUpdateAmount("");
    }
  };

  const toggleDownloadSelection = (docId: string) => {
    setSelectedForDownload((prev) => {
      const copy = new Set(prev);
      if (copy.has(docId)) copy.delete(docId);
      else copy.add(docId);
      return copy;
    });
  };

  const selectAllForDownload = () => {
    if (selectedForDownload.size === uploadedDocs.length) {
      setSelectedForDownload(new Set());
    } else {
      const allIds = uploadedDocs.map((doc) => doc.id);
      setSelectedForDownload(new Set(allIds));
    }
  };

  const handleDownloadZip = async () => {
    if (selectedForDownload.size === 0 || !merchantCode) return;
    setDownloadingFiles(true);
    setDownloadProgress(0);
    setDownloadErrors([]);
    const zip = new JSZip();
    const folder = zip.folder(projectId);
    const docsToDownload = uploadedDocs.filter((doc) => selectedForDownload.has(doc.id));
    const errors: string[] = [];

    for (let i = 0; i < docsToDownload.length; i++) {
      const doc = docsToDownload[i];
      try {
        setDownloadProgress(((i) / docsToDownload.length) * 100);
        const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${doc.fileName}`);
        const blob = await getBlob(storageRef);
        if (blob.size > 0) {
          folder?.file(doc.fileName, blob);
        } else {
          throw new Error("Empty file blob");
        }
      } catch (error) {
        console.error(`Error fetching file ${doc.fileName}:`, error);
        errors.push(doc.fileName);
      }
    }
    setDownloadProgress(100);
    if (errors.length > 0) {
      setDownloadErrors(errors);
    }
    try {
      zip.generateAsync({ type: "blob" }).then((content) => {
        if (content.size > 0) {
          saveAs(content, `${projectId}-documents.zip`);
          setTimeout(() => {
            setDownloadingFiles(false);
            if (errors.length === 0) {
              setDownloadDialogOpen(false);
              setSelectedForDownload(new Set());
            }
          }, 1000);
        } else {
          throw new Error("ZIP archive is empty");
        }
      });
    } catch (error) {
      console.error("Error generating ZIP file:", error);
      showToast({ message: "Error generating ZIP file" });
      setDownloadingFiles(false);
    }
  };

  // const handleView = (doc: UploadedDocument) => {
  //   if (!merchantCode) return;
  //   const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${doc.fileName}`);
  //   getDownloadURL(storageRef)
  //     .then((url) => window.open(url, "_blank"))
  //     .catch((error) => {
  //       console.error("Error getting download URL:", error);
  //       showToast({ message: "Error opening document" });
  //     });
  // };

  const handleDownloadSingle = async (doc: UploadedDocument) => {
    if (!merchantCode) return;
    try {
      const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${doc.fileName}`);
      const url = await getDownloadURL(storageRef);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast({ message: "Downloading document" });
    } catch (error) {
      console.error("Error downloading document:", error);
      showToast({ message: "Error downloading document" });
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const userDoc = await getDocs(collection(db, "users"));
        const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();
        if (!userData || !userData.merchantCode) {
          console.error("Merchant code not found.");
          return;
        }
        setMerchantCode(userData.merchantCode);
        const docs = await fetchDocumentsForProject(userData.merchantCode, projectId);
        setUploadedDocs(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
        showToast({ message: "Error loading documents" });
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, [user, projectId, showToast]);

  return (
    <div className="space-y-4">
      {/* Display Uploaded Documents */}
      <h2 className="text-xl font-bold mb-4">Project Documents</h2>
      <div>
        
        {loadingDocs ? (
          <div className="flex items-center space-x-2 py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-muted-foreground">Loading accounting documents...</p>
          </div>
        ) :uploadedDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    </div>
                  ) : (
          <>
          <Card className="p-10">
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>Documentation related to the project</CardDescription>
          </CardHeader>
            <DocumentList
              uploadedDocs={uploadedDocs}
              onView={handleView}
              onDownload={handleDownloadSingle}
              onEditAmount={openEditDialog}
              onUpdateFile={openUpdateDialog}
              onDelete={openDeleteDialog}
            />
            
            <div className="px-6 flex justify-end">
              <Button className="mt-5" type="button" variant="default" onClick={() => setDownloadDialogOpen(true)}>
                Download Documents
              </Button>
            </div>
            </Card>
          </>
        )}
      </div>

      <Separator className="mt-8" />
      {/* Upload New Document */}
      <h2 className="text-xl font-bold  ">Upload New Document</h2>

      <UploadNewDocument
        docType={docType}
        setDocType={setDocType}
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
        onUpload={handleUpload}
        loading={loading}
      />

      {/* Dialogs */}
      <AmountDialog
        open={showAmountDialog}
        onOpenChange={setShowAmountDialog}
        doc={currentUploadedDoc}
        docAmount={docAmount}
        onAmountChange={setDocAmount}
        onSave={handleAmountSave}
        loading={loading}
      />
      <DownloadDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        docs={uploadedDocs}
        selectedForDownload={selectedForDownload}
        toggleDownloadSelection={toggleDownloadSelection}
        selectAllForDownload={selectAllForDownload}
        downloadProgress={downloadProgress}
        downloadingFiles={downloadingFiles}
        downloadErrors={downloadErrors}
        onDownload={handleDownloadZip}
      />
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        loading={loading}
      />
      <UpdateDocumentDialog
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        doc={docToUpdate}
        updateFile={updateFile}
        onFileSelect={setUpdateFile}
        updateAmount={updateAmount}
        onUpdateAmountChange={setUpdateAmount}
        onConfirm={handleUpdateConfirm}
        loading={loading}
      />
      <EditDocumentAmountDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        doc={docToEdit}
        editAmount={editAmount}
        onEditAmountChange={setEditAmount}
        onSave={handleEditSave}
        loading={loading}
      />

      {viewingDocumentUrl && (
        <FullscreenDocumentViewer
          open={fullscreenViewerOpen}
          onOpenChange={setFullscreenViewerOpen}
          documentUrl={viewingDocumentUrl}
          documentName={viewingDocumentName}
        />
      )}
    </div>
  );
};

export default UploadDocumentsSection;
