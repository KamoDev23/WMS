"use client";
import { PlusIcon, DollarSign, ShieldCheckIcon, CheckCircle, FileText, BellIcon, LifeBuoyIcon, Loader2, CalendarIcon, MoreVertical, Eye, Trash, Edit2, Download } from "lucide-react";
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
import { DatePickerWithRange } from "@/app/components/customs/date-picker-with-range";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/firebase/firebase-config";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { Separator } from "@/components/ui/separator";
import AccountingUploadDialog, { AccountingCategory } from "@/app/components/business/accounting/accounting-document-selector-command";
import TransactionDetailsDialog from "@/app/components/business/accounting/transaction-details-dialog";
import DocumentEditDialog from "@/app/components/business/accounting/document-edit-dialog";
import { format } from "date-fns";
import FullscreenDocumentViewer from "@/app/components/business/components/fullscreen-document-viewer";
import DocumentDownloader from "@/app/components/business/accounting/document-downloader-dialog";
import { toast } from "sonner";

export interface AccountingDocument {
  id: string;
  category: AccountingCategory;
  fileName: string;
  url: string;
  uploadedAt: Date;
  amount?: number;
  transactionDate?: Date;
  docType?: string;
  label?: string;
}

const MAIN_CATEGORIES = [
  "Recurring Expenditure",
  "Contingent Expenses",
  "Compensation",
  "Bank Statements",
  "Income (Remittances)",
  "Fuel & Maintenance",
];

export default function AccountingPage() {
  const { user } = useAuth(); 
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<AccountingDocument | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [documents, setDocuments] = useState<AccountingDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");
  const [documentLabel, setDocumentLabel] = useState<string>("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Transaction details state
  const [showTransactionDialog, setShowTransactionDialog] = useState<boolean>(false);
  const [savingTransaction, setSavingTransaction] = useState<boolean>(false);
  const [recentlyUploadedDoc, setRecentlyUploadedDoc] = useState<AccountingDocument | null>(null);

  // Document edit state
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [documentToEdit, setDocumentToEdit] = useState<AccountingDocument | null>(null);

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<AccountingDocument | null>(null);

  const categoryIcons: Record<string, React.ComponentType<{ size?: number }>> = {
    "Recurring Expenditure": DollarSign,
    "Contingent Expenses": ShieldCheckIcon,
    "Compensation": CheckCircle,
    "Bank Statements": FileText,
    "Income (Remittances)": BellIcon,
    "Fuel & Maintenance": LifeBuoyIcon,
  };

  // Fetch documents from Firestore, filtered by dateRange if provided.
  const fetchDocuments = async (code?: string) => {
    const currentMerchantCode = code || merchantCode;
    if (!currentMerchantCode) return;
  
    try {
      const querySnapshot = await getDocs(
        collection(db, "merchants", currentMerchantCode, "accountingDocuments")
      );
  
      const docs: AccountingDocument[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<AccountingDocument, "id">;
        
        // Handle dates
        const uploadedAt = data.uploadedAt && (data.uploadedAt as any).toDate 
          ? (data.uploadedAt as any).toDate() 
          : new Date(data.uploadedAt);
          
        const transactionDate = data.transactionDate && (data.transactionDate as any).toDate
          ? (data.transactionDate as any).toDate()
          : data.transactionDate ? new Date(data.transactionDate) : undefined;
  
        docs.push({ 
          id: docSnap.id, 
          ...data, 
          uploadedAt,
          transactionDate
        });
      });
  
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching accounting documents:", error);
    }
  };
  
  const fetchMerchantCode = async (userId: string): Promise<string | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();
  
      if (userData && userData.merchantCode) {
        return userData.merchantCode;
      } else {
        console.error("Merchant code not found for this user.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching merchant code:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!user) return;
  
    const loadMerchantCode = async () => {
      const code = await fetchMerchantCode(user.uid);
      if (code) {
        setMerchantCode(code);
        fetchDocuments(code); // Fetch documents once we have the merchant code
      }
    };
  
    loadMerchantCode();
  }, [user]);
  
  useEffect(() => {
    fetchDocuments();
  }, [user, merchantCode]);

  // Function to filter documents by transaction date range
  const filterDocumentsByDateRange = (documents: AccountingDocument[]) => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return documents;
    }

    return documents.filter(doc => {
      // Skip documents without a transaction date
      if (!doc.transactionDate) return false;
      
      // Convert all dates to midnight for proper comparison
      const docDate = new Date(doc.transactionDate);
      docDate.setHours(0, 0, 0, 0);
      
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999); // End of day
      
      // Check if document's transaction date is within the range
      return docDate >= fromDate && docDate <= toDate;
    });
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !merchantCode || !selectedMainCategory || !documentLabel.trim()) {
      console.error("Missing required fields: Merchant Code, File, Main Category, or Document Label.");
      return;
    }
    setLoading(true);
    try {
      const timestamp = Date.now();
      const originalExt = selectedFile.name.substring(selectedFile.name.lastIndexOf("."));
      
      // Create the custom filename with the format: "[MainCategory]: [UserLabel].extension"
      const newFileName = `${selectedMainCategory}: ${documentLabel}${originalExt}`;
      
      // Upload file to Storage under a merchant-specific folder.
      const storageRef = ref(
        storage,
        `merchants/${merchantCode}/accounting/${selectedMainCategory}/${newFileName}`
      );
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(snapshot.ref);
    
      const docData = {
        category: selectedMainCategory as AccountingCategory,
        fileName: newFileName,
        url,
        uploadedAt: new Date(),
        label: documentLabel,
      };
    
      // Save document data to Firestore under merchant-specific path.
      const docRef = await addDoc(
        collection(db, "merchants", merchantCode, "accountingDocuments"),
        docData
      );
    
      const newDoc: AccountingDocument = {
        id: docRef.id,
        ...docData,
        category: selectedMainCategory as AccountingCategory,
        uploadedAt: new Date(),
      };
    
      setDocuments((prev) => [...prev, newDoc]);
      
      // Store the uploaded document and show transaction dialog
      setRecentlyUploadedDoc(newDoc);
      
      // Close the upload dialog
      setUploadDialogOpen(false);
      
      // Reset upload form
      setSelectedFile(null);
      setSelectedMainCategory("");
      setDocumentLabel("");
      toast.success("Document uploaded successfully");
      
      // Open transaction details dialog
      setShowTransactionDialog(true);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error uploading document");
    } finally {
      setLoading(false);
    }
  };

  // Handle saving transaction details
  const handleSaveTransactionDetails = async (transactionDate: Date, amount: number) => {
    if (!recentlyUploadedDoc || !merchantCode) return;
    
    setSavingTransaction(true);
    try {
      const docRef = doc(
        db,
        "merchants",
        merchantCode,
        "accountingDocuments",
        recentlyUploadedDoc.id
      );
  
      await updateDoc(docRef, {
        amount: amount,
        transactionDate: Timestamp.fromDate(transactionDate)
      });
  
      // Update local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === recentlyUploadedDoc.id 
            ? { ...d, amount: amount, transactionDate: transactionDate }
            : d
        )
      );
  
      // Close dialog and reset state
      setShowTransactionDialog(false);
      setRecentlyUploadedDoc(null);
    
      toast.success("Transaction details saved successfully");
    } catch (error) {
      console.error("Error saving transaction details:", error);
      toast.error("Error saving transaction details");
    } finally {
      setSavingTransaction(false);
    }
  };

  // Handle document edit
  const handleEditDocument = (document: AccountingDocument) => {
    setDocumentToEdit(document);
    setShowEditDialog(true);
  };

  // Handle saving document edits
  const handleSaveEdit = async (updates: {
    label?: string;
    amount?: number | null;
    transactionDate?: Date | null;
    newFile?: File | null;
  }) => {
    if (!documentToEdit || !merchantCode) return;
    
    setSavingEdit(true);
    try {
      const docRef = doc(
        db,
        "merchants",
        merchantCode,
        "accountingDocuments",
        documentToEdit.id
      );
      
      const updateData: any = {};
      
      // Handle metadata updates
      if (updates.label !== undefined) {
        updateData.label = updates.label;
      }
      
      if (updates.amount !== undefined) {
        updateData.amount = updates.amount;
      }
      
      if (updates.transactionDate !== undefined) {
        updateData.transactionDate = updates.transactionDate 
          ? Timestamp.fromDate(updates.transactionDate)
          : null;
      }
      
      // If there's a new file, upload it and update the URL
      if (updates.newFile) {
        const originalExt = updates.newFile.name.substring(updates.newFile.name.lastIndexOf("."));
        const label = updates.label || documentToEdit.label || documentToEdit.fileName;
        
        // Create the custom filename
        const newFileName = `${documentToEdit.category}: ${label}${originalExt}`;
        
        // Upload new file
        const storageRef = ref(
          storage,
          `merchants/${merchantCode}/accounting/${documentToEdit.category}/${newFileName}`
        );
        
        const snapshot = await uploadBytes(storageRef, updates.newFile);
        const url = await getDownloadURL(snapshot.ref);
        
        // Delete old file if filename changed
        if (newFileName !== documentToEdit.fileName) {
          try {
            const oldFileRef = ref(
              storage,
              `merchants/${merchantCode}/accounting/${documentToEdit.category}/${documentToEdit.fileName}`
            );
            await deleteObject(oldFileRef);
          } catch (error) {
            console.error("Error deleting old file:", error);
          }
        }
        
        // Update document data
        updateData.url = url;
        updateData.fileName = newFileName;
      }
      
      // Update document in Firestore
      await updateDoc(docRef, updateData);
      
      // Update local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentToEdit.id
            ? { 
                ...d, 
                ...updateData,
                // Convert Timestamp back to Date if present
                transactionDate: updateData.transactionDate ? 
                  updateData.transactionDate.toDate() : 
                  d.transactionDate
              }
            : d
        )
      );
      
      // Close dialog and reset state
      setShowEditDialog(false);
      setDocumentToEdit(null);
      toast.success("Document updated successfully");
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete || !merchantCode) return;
    
    setLoading(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(
        db, 
        "merchants", 
        merchantCode, 
        "accountingDocuments", 
        documentToDelete.id
      ));
      
      // Delete from Storage
      const storageRef = ref(
        storage, 
        `merchants/${merchantCode}/accounting/${documentToDelete.category}/${documentToDelete.fileName}`
      );
      await deleteObject(storageRef);
      
      // Update local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id));
      
      // Close dialog and reset state
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return format(date, "MMM d, yyyy");
  };

  // Group documents by category
  const filteredDocuments = filterDocumentsByDateRange(documents);

  // Group documents by category
  const groupedDocs = filteredDocuments.reduce((acc, doc) => {
    (acc[doc.category] = acc[doc.category] || []).push(doc);
    return acc;
  }, {} as Record<AccountingCategory, AccountingDocument[]>);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Accounting</h2>
          <p className="text-muted-foreground">
            Manage your company's accounting documents.
          </p>
        </div>
        
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <div>Company Documents</div>
            <Button onClick={() => setUploadDialogOpen(true)} size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </CardTitle> 
        </CardHeader>
        <CardContent>
          {/* Date Range Picker */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
            <DatePickerWithRange value={dateRange} onSelect={setDateRange} />
          </div>

          {/* Accordion for documents */}
          <div className="space-y-4">
            {MAIN_CATEGORIES.map((category) => {
              const docsForCategory = groupedDocs[category as AccountingCategory] || [];
              const IconComponent = categoryIcons[category] || DollarSign;
              return (
                <Accordion key={category} type="single" collapsible className="w-full">
                  <AccordionItem value={category} className="py-2">
                    <AccordionTrigger className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between rounded-md py-2 text-left text-[15px] leading-6 font-semibold transition-all outline-none focus-visible:ring-[3px]">
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                          <IconComponent size={16}  />
                        </span>
                        <span className="flex flex-col">
                          <span>{category}</span>
                          <span className="text-sm font-normal">
                            {docsForCategory.length} documents
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground ml-3 pl-10 pb-2">
                      {docsForCategory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No documents uploaded for this section.
                        </p>
                      ) : (
                        docsForCategory.map((doc) => (
                          <Card key={doc.id} className="bg-sidebar px-4 py-2 mb-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <div className="font-medium">{doc.label || doc.fileName}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-2">
                                  {doc.amount !== undefined && (
                                    <span className="inline-flex items-center gap-1">
                                      
                                      R{doc.amount.toFixed(2)}
                                    </span>
                                  )}
                                  {doc.transactionDate && (
                                    <span className="inline-flex items-center gap-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      {formatDate(doc.transactionDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Options Dropdown */}
                              {/* Options Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                  <DropdownMenuItem onClick={() => {
                                    setViewingDocument(doc);
                                    setFullscreenOpen(true);
                                  }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditDocument(doc)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setDocumentToDelete(doc);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Card>
                        ))
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  <div></div>
                </Accordion>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
        <Button 
            variant="outline" 
            onClick={() => setDownloadDialogOpen(true)} 
            size="sm"
            disabled={filteredDocuments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Documents
          </Button>
        </CardFooter>
      </Card>

      {/* Upload Dialog */}
      <AccountingUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        selectedMainCategory={selectedMainCategory}
        setSelectedMainCategory={setSelectedMainCategory}
        documentLabel={documentLabel}
        setDocumentLabel={setDocumentLabel}
        onUpload={handleUpload}
        loading={loading}
      />

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        document={recentlyUploadedDoc}
        onSave={handleSaveTransactionDetails}
        loading={savingTransaction}
      />

      {/* Document Edit Dialog */}
      <DocumentEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        document={documentToEdit}
        onSave={handleSaveEdit}
        loading={savingEdit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {documentToDelete && (
            <div className="py-4">
              <p className="font-medium">{documentToDelete.label || documentToDelete.fileName}</p>
              <p className="text-sm text-muted-foreground mt-1">{documentToDelete.category}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDocument}
              disabled={loading}
            >
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

      <DocumentDownloader
        isOpen={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        documents={filteredDocuments}
        dateRange={dateRange}
      />

      {viewingDocument && (
        <FullscreenDocumentViewer
          open={fullscreenOpen}
          onOpenChange={setFullscreenOpen}
          documentUrl={viewingDocument.url}
          documentName={viewingDocument.label || viewingDocument.fileName}
        />
      )}
    </section>
  );
}