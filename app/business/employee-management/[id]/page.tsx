"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  CircleX, 
  FileText, 
  HomeIcon, 
  Plus, 
  CalendarIcon, 
  Download,
  Edit, 
  Eye, 
  MoreVertical, 
  Trash 
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteEmployeeDocument,
  fetchEmployeeById,
  fetchEmployeeDocuments,
  fetchUserMerchantCode,
  saveEmployee,
  uploadEmployeeDocument,
  updateEmployeeDocumentExpiry
} from "@/lib/employee-utils";
import { format } from "date-fns";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"; 
import EmployeeUploadDialog from "@/app/components/business/employee-management/upload-document-dialog";
import EmployeeExpiryDialog from "@/app/components/business/components/expiry-date-dialog";
import EditDocumentDialog from "@/app/components/business/employee-management/edit-document-dialog";
import FullscreenDocumentViewer from "@/app/components/business/components/fullscreen-document-viewer";
import EmployeeDocumentDownloader from "@/app/components/business/employee-management/employee document-downloader";
import { toast } from "sonner";
 
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  age: string;
  gender: string;
  role: string;
  dateOfHire: string;
  phoneNumber: string;
  email: string;
  address: string;
  merchantCode: string;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  url: string;
  docType: string;
  employeeId: string;
  expiryDate?: string; // ISO string format
}

export default function EmployeeDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingEmployeeDetails, setSavingEmployeeDetails] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [deletingDoc, setDeletingDoc] = useState<boolean>(false);
  const [savingExpiryDate, setSavingExpiryDate] = useState<boolean>(false);

  // Document states
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("");
  const [hasExpiry, setHasExpiry] = useState<boolean>(false);
  
  // Recently uploaded document for expiry date setting
  const [recentlyUploadedDoc, setRecentlyUploadedDoc] = useState<UploadedDocument | null>(null);

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expiryDateDialogOpen, setExpiryDateDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; fileName: string } | null>(null);
  
  // New state for document editing and viewing
  const [editDocDialogOpen, setEditDocDialogOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<UploadedDocument | null>(null);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [fullscreenViewerOpen, setFullscreenViewerOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  // Fetch employee details from Firestore
  useEffect(() => {
    if (!user || !id) return;

    const loadEmployeeData = async () => {
      try {
        setLoading(true);

        // Get the merchantCode for the current user
        const userMerchantCode = await fetchUserMerchantCode();
        if (!userMerchantCode) {
          console.error("Merchant code not found");
          return;
        }

        setMerchantCode(userMerchantCode);

        // Fetch employee with the merchant code
        const employeeData = await fetchEmployeeById(userMerchantCode, id);
        if (employeeData) {
          setEmployee({ ...employeeData, merchantCode: userMerchantCode });
          // Fetch documents after employee is loaded
          await fetchDocuments(userMerchantCode, employeeData.id);
        }
      } catch (error) {
        console.error("Error loading employee data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeData();
  }, [user, id]);

  const fetchDocuments = async (merchantCode: string, employeeId: string) => {
    if (!merchantCode || !employeeId) return;

    setLoading(true);
    try {
      const docs = await fetchEmployeeDocuments(merchantCode, employeeId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for employee details
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!employee) return;
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!merchantCode || !employee) return;
    setSavingEmployeeDetails(true);
    await saveEmployee(merchantCode, employee);
    setSavingEmployeeDetails(false);
    setEditMode(false);
  };

  // Handle file upload for employee documents
  const handleUploadDocument = async () => {
    if (!selectedFile || !merchantCode || !employee) return;
    setUploadingDoc(true);
    try {
      // Upload the document first
      const newDoc = await uploadEmployeeDocument(
        merchantCode,
        employee.id,
        selectedFile,
        docType
      );
      if (newDoc) {
        setDocuments((prev) => [...prev, newDoc]);
        
        // If document has expiry date, open the expiry date dialog
        if (hasExpiry) {
          setRecentlyUploadedDoc(newDoc);
          setUploadDialogOpen(false); // Close upload dialog
          setExpiryDateDialogOpen(true); // Open expiry date dialog
        } else {
          // Otherwise just close the upload dialog
          setUploadDialogOpen(false);
          setSelectedFile(null);
          setDocType("");
          setHasExpiry(false);
        }
        toast.success("Document successfuly uploaded")
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error uploading document")
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSaveExpiryDate = async (date: Date) => {
    if (!merchantCode || !employee || !recentlyUploadedDoc) return;
    
    setSavingExpiryDate(true);
    try {
      // Update the document with expiry date in Firestore
      await updateEmployeeDocumentExpiry(
        merchantCode,
        employee.id,
        recentlyUploadedDoc.id,
        date
      );
      
      // Update local state
      const expiryDateString = date.toISOString();
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === recentlyUploadedDoc.id 
            ? { ...doc, expiryDate: expiryDateString } 
            : doc
        )
      );
      
      setExpiryDateDialogOpen(false);
      setRecentlyUploadedDoc(null);
      setSelectedFile(null);
      setDocType("");
      setHasExpiry(false);
      toast.success("Expiry date saved successfuly")
    } catch (error) {
      console.error("Error saving expiry date:", error);
      toast.error("Error saving expiry date")
    } finally {
      setSavingExpiryDate(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!merchantCode || !employee || !docToDelete) return;
    setDeletingDoc(true);
    try {
      await deleteEmployeeDocument(merchantCode, employee.id, docToDelete.id, docToDelete.fileName);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docToDelete.id));
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setDeletingDoc(false);
      setDocToDelete(null);
    }
  };

  const handleViewDocument = (url: string, fileName: string) => {
    setViewingDocumentUrl(url);
    setFullscreenViewerOpen(true);
  };

  // Add function to handle document download
  const handleDownloadDocument = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };
  
  // Add function to handle editing a document
  const handleEditDocument = (doc: UploadedDocument) => {
    setDocumentToEdit(doc);
    setDocType(doc.docType);
    setHasExpiry(!!doc.expiryDate);
    setSelectedFile(null);
    setEditDocDialogOpen(true);
  };
  
  // Function to handle document update submission
  const handleUpdateDocument = async () => {
    if (!selectedFile || !merchantCode || !employee || !documentToEdit) return;
    
    setUploadingDoc(true);
    try {
      // First delete the old document
      await deleteEmployeeDocument(
        merchantCode, 
        employee.id, 
        documentToEdit.id, 
        documentToEdit.fileName
      );
      
      // Then upload the new document with the same docType
      const newDoc = await uploadEmployeeDocument(
        merchantCode,
        employee.id,
        selectedFile,
        docType // Reuse the same document type
      );
      
      if (newDoc) {
        // Replace the old document in the documents array
        setDocuments(prev => prev.map(doc => 
          doc.id === documentToEdit.id ? newDoc : doc
        ));
        
        // If document has expiry date, open the expiry date dialog
        if (hasExpiry) {
          setRecentlyUploadedDoc(newDoc);
          setEditDocDialogOpen(false); // Close edit dialog
          setExpiryDateDialogOpen(true); // Open expiry date dialog
        } else {
          // Reset state and close dialog
          setEditDocDialogOpen(false);
          setSelectedFile(null);
          setDocumentToEdit(null);
        }
      }
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      setUploadingDoc(false);
    }
  };

  const openUploadDialog = () => {
    setSelectedFile(null);
    setDocType("");
    setHasExpiry(false);
    setUploadDialogOpen(true);
  };

  // Format expiry date for display
  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Invalid date";
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <p className="text-muted-foregroun mb-4">Edit employee details and documentation.</p>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <HomeIcon size={16} aria-hidden="true" />
                <BreadcrumbLink href="/">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/projects">Employee Management</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{employee?.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="space-x-2">
          {editMode && (
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {savingEmployeeDetails ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Employee Details Form */}
      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : employee ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle> 
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={employee.firstName}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={employee.lastName}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="idNumber" className="block text-sm font-medium">ID Number</Label>
                  <Input
                    id="idNumber"
                    name="idNumber"
                    value={employee.idNumber}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="age" className="block text-sm font-medium">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    value={employee.age}
                    onChange={handleChange}
                    readOnly
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="block text-sm font-medium">Gender</Label>
                  <Input
                    id="gender"
                    name="gender"
                    value={employee.gender}
                    onChange={handleChange}
                    readOnly
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="block text-sm font-medium">Role</Label>
                  <Input
                    id="role"
                    name="role"
                    value={employee.role}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfHire" className="block text-sm font-medium">Date of Hire</Label>
                  <Input
                    id="dateOfHire"
                    name="dateOfHire"
                    type="date"
                    value={employee.dateOfHire}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="block text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={employee.phoneNumber}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={employee.email}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="block text-sm font-medium">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={employee.address}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p>Employee not found</p>
      )}

      <Separator />

      {/* Documents Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Documents</h3>
        <div className="space-x-2">
         
          <Button onClick={openUploadDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Documents List Section - Updated with dropdown menu */}
      {loading ? (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary/70" />
                    <div>
                      <p className="text-sm font-medium">
                        {doc.fileName}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground space-x-2">
                        <span>{doc.docType}</span>
                        {doc.expiryDate && (
                          <div className="flex items-center space-x-1">
                            <span>•</span>
                            <CalendarIcon className="h-3 w-3" />
                            <span>Expires: {formatExpiryDate(doc.expiryDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Replace buttons with dropdown menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDocument(doc.url, doc.fileName)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem onClick={() => handleDownloadDocument(doc.url, doc.fileName)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem> */}
                      <DropdownMenuItem onClick={() => handleEditDocument(doc)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Replace
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setDocToDelete({ id: doc.id, fileName: doc.fileName });
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
          <div className="flex mt-2 justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDownloadDialogOpen(true)}
            disabled={documents.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Documents
          </Button>
          </div>
        </div>
      )}

      {/* Upload Document Dialog */}
      {merchantCode && (
        <EmployeeUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          docType={docType}
          setDocType={setDocType}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          onConfirm={handleUploadDocument}
          uploading={uploadingDoc}
          merchantCode={merchantCode}
          hasExpiry={hasExpiry}
          setHasExpiry={setHasExpiry}
        />
      )}

      {/* Add Edit Document Dialog */}
      {merchantCode && (
        <EditDocumentDialog
          open={editDocDialogOpen}
          onOpenChange={setEditDocDialogOpen}
          document={documentToEdit}
          docType={docType}
          setDocType={setDocType}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          onConfirm={handleUpdateDocument}
          uploading={uploadingDoc}
          hasExpiry={hasExpiry}
          setHasExpiry={setHasExpiry}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              {deletingDoc ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expiry Date Dialog */}
      {recentlyUploadedDoc && (
        <EmployeeExpiryDialog
          open={expiryDateDialogOpen}
          onOpenChange={setExpiryDateDialogOpen}
          documentUrl={recentlyUploadedDoc.url}
          documentName={recentlyUploadedDoc.fileName}
          onSave={handleSaveExpiryDate}
          isLoading={savingExpiryDate}
        />
      )}

      {/* Document Downloader Dialog */}
      <EmployeeDocumentDownloader
        isOpen={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        documents={documents}
        employeeName={employee ? `${employee.firstName} ${employee.lastName}` : "Employee"}
      />

      {/* Fullscreen Document Viewer */}
      {viewingDocumentUrl && (
        <FullscreenDocumentViewer
          open={fullscreenViewerOpen}
          onOpenChange={setFullscreenViewerOpen}
          documentUrl={viewingDocumentUrl}
          documentName="Employee Document"
        />
      )}
    </section>
  );
}