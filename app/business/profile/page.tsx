"use client";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
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
import { saveProfileData, uploadProfileDocument, deleteProfileDocument, fetchProfileData, fetchProfileDocuments } from "@/lib/profile-utils";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase/firebase-config";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { 
  Loader2, 
  FileText, 
  Plus, 
  CalendarIcon, 
  Download, 
  MoreVertical, 
  Eye, 
  Trash,
  Edit 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import DeleteConfirmationDialog from "@/app/components/customs/delete-confirmation-dialog"; 
import DocumentSelectorCommand from "@/app/components/business/profile/company-document-selector-command";
import ExpiryDateDialog from "@/app/components/business/components/expiry-date-dialog";
import FullscreenDocumentViewer from "@/app/components/business/components/fullscreen-document-viewer";
import ProfileDocumentDownloader from "@/app/components/business/profile/profile-document-downloader";
 
interface ProfileData {
  companyName: string;
  address: string;
  companyEmail?: string;
  phoneNumber?: string; 
  vatNumber?: string;
  companyLogo?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
}

interface ProfileDocument {
  id: string;
  type: string;
  fileName: string;
  url: string;
  expiryDate?: string; // ISO string format
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingExpiryDate, setSavingExpiryDate] = useState(false);

  // Document states
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("");
  const [hasExpiry, setHasExpiry] = useState<boolean>(false);
  
  // Recently uploaded document for expiry date setting
  const [recentlyUploadedDoc, setRecentlyUploadedDoc] = useState<ProfileDocument | null>(null);

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expiryDateDialogOpen, setExpiryDateDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, fileName: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // New states for document viewing and downloading
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);
  const [viewingDocumentName, setViewingDocumentName] = useState<string>("");
  const [fullscreenViewerOpen, setFullscreenViewerOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setLoadingProfile(true);
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        if (!userData || !userData.merchantCode) {
          console.error("Merchant code not found.");
          return;
        }
        const merchantCode = userData.merchantCode;
        setMerchantCode(merchantCode);
  
        // Fetch Profile Data
        const profileData = await fetchProfileData(merchantCode);
        setProfile({
          companyName: profileData?.companyName || "",
          address: profileData?.address || "",
          companyEmail: profileData?.companyEmail || "",
          phoneNumber: profileData?.phoneNumber || "",
          vatNumber: profileData?.vatNumber || "",
          companyLogo: profileData?.companyLogo || "",
          bankName: profileData?.bankName || "",
          accountHolder: profileData?.accountHolder || "",
          accountNumber: profileData?.accountNumber || "",
          branchCode: profileData?.branchCode || "",
        });
  
        // Fetch Documents
        setLoadingDocuments(true);
        const docs = await fetchProfileDocuments(merchantCode);
        setDocuments(docs);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoadingProfile(false);
        setLoadingDocuments(false);
      }
    };
  
    loadData();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev!,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantCode || !profile) return;
      
    setSavingProfile(true);
    try {
      await saveProfileData(merchantCode, profile);
      toast.success("Profile saved successfully");
      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile data");
    } finally {
      setSavingProfile(false);
    }
  };
  
  const handleUploadDocument = async () => {
    if (!selectedFile || !merchantCode || !docType) return;
    setUploading(true);

    try {
      // Upload the document first
      const newDoc = await uploadProfileDocument(merchantCode, selectedFile, docType);
      
      if (newDoc) {
        setDocuments((prev) => [...prev, newDoc]);
        toast.success("Document uploaded successfully");
        
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
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveExpiryDate = async (date: Date) => {
    if (!merchantCode || !recentlyUploadedDoc) return;
    
    setSavingExpiryDate(true);
    try {
      // Update the document with expiry date in Firestore
      const docRef = doc(db, "merchants", merchantCode, "documents", recentlyUploadedDoc.id);
      const expiryDateString = date.toISOString();
      
      await updateDoc(docRef, {
        expiryDate: expiryDateString
      });
      
      // Update local state
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === recentlyUploadedDoc.id 
            ? { ...doc, expiryDate: expiryDateString } 
            : doc
        )
      );
      
      toast.success("Expiry date set successfully");
      setExpiryDateDialogOpen(false);
      setRecentlyUploadedDoc(null);
      setSelectedFile(null);
      setDocType("");
      setHasExpiry(false);
    } catch (error) {
      console.error("Error saving expiry date:", error);
      toast.error("Failed to set expiry date");
    } finally {
      setSavingExpiryDate(false);
    }
  };

  const openDeleteDialog = (docId: string, fileName: string) => {
    setDocumentToDelete({ id: docId, fileName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!merchantCode || !documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProfileDocument(merchantCode, documentToDelete.id, documentToDelete.fileName);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id));
      toast.success("Document deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  const handleViewDocument = (url: string, fileName: string) => {
    setViewingDocumentUrl(url);
    setViewingDocumentName(fileName);
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
      
      toast.success("Document download started");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
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

  // Set up dropzone for file upload in dialog
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    multiple: false,
  });

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile</h2>
          <p className="text-muted-foreground">
            Edit company details and documentation.
          </p>
        </div>
        {editMode ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <> <Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving... </ > : "Save Profile"}
            </Button>
            <Button size="sm" onClick={() => setEditMode(false)} variant="outline">
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setEditMode(true)}>Edit</Button>
        )}
      </div>

      <Separator />

      {/* Profile Form */}
      {loadingProfile ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <Card className="p-6">
          <CardHeader>
          <h2 className="text-xl font-bold mb-2">Company Details</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-9 gap-4">
              {/* Column 1: Header and description */}
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  Update your company details below.
                </p>
              </div>
              <div className="col-span-7   gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="block text-sm font-medium">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={profile?.companyName}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>   
                  <div>
                    <Label htmlFor="address" className="block text-sm font-medium">
                      Address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={profile?.address}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="companyEmail" className="block text-sm font-medium">
                      Company Email
                    </Label>
                    <Input
                      id="companyEmail"
                      name="companyEmail"
                      value={profile?.companyEmail}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="block text-sm font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={profile?.phoneNumber}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="vatNumber" className="block text-sm font-medium">
                      VAT Number
                    </Label>
                    <Input
                      id="vatNumber"
                      name="vatNumber"
                      value={profile?.vatNumber}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchantCode" className="block text-sm font-medium">
                      Merchant Code
                    </Label>
                    <Input
                      id="merchantCode"
                      name="merchantCode"
                      value={merchantCode || ""}
                      onChange={handleProfileChange}
                      readOnly 
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6"/>
 
            <div className="grid grid-cols-9 gap-4">
              {/* Column 1: Header and description */}
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  Update your company banking details below.
                </p>
              </div>
              <div className="col-span-7   gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName" className="block text-sm font-medium">
                      Bank Name
                    </Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={profile?.bankName}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>   
                  <div>
                    <Label htmlFor="accountHolder" className="block text-sm font-medium">
                      Account Holder
                    </Label>
                    <Input
                      id="accountHolder"
                      name="accountHolder"
                      value={profile?.accountHolder}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="accountNumber" className="block text-sm font-medium">
                      Account Number
                    </Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={profile?.accountNumber}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branchCode" className="block text-sm font-medium">
                      Branch code
                    </Label>
                    <Input
                      id="branchCode"
                      name="branchCode"
                      value={profile?.branchCode}
                      onChange={handleProfileChange}
                      readOnly={!editMode}
                      className="mt-1"
                    />
                  </div>
                </div>
                
              </div>
            </div>
            
          </CardContent>
        </Card>
      </form>
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

      {/* Documents List */}
      {loadingDocuments ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                        <span>{doc.type}</span>
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
                  
                  {/* Options Dropdown Menu */}
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
                      <DropdownMenuItem onClick={() => handleDownloadDocument(doc.url, doc.fileName)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(doc.id, doc.fileName)}
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
          <div className="flex  mt-2 justify-end">
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
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new company document.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Document Category Selection */}
            <div>
              <Label className="block mb-2 text-sm font-medium">
                Document Category
              </Label>
              {merchantCode && (
                <DocumentSelectorCommand 
                  merchantCode={merchantCode}
                  selected={docType}
                  onSelect={setDocType}
                  hasExpiry={hasExpiry}
                  setHasExpiry={setHasExpiry}
                />
              )}
            </div>

            {/* Dropzone for file upload */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed p-4 rounded flex items-center justify-center h-40 ${
                isDragActive ? "bg-muted" : ""
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <p className="text-sm">File selected: {selectedFile.name}</p>
              ) : isDragActive ? (
                <p className="text-sm">Drop the file here...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Drag &amp; drop a file here, or click to select one.
                </p>
              )}
            </div>
            
          </div>
          
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={uploading || !selectedFile || !docType}>
              {uploading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Upload Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        documentName={documentToDelete?.fileName || ""}
        onConfirm={handleDeleteDocument}
        isDeleting={isDeleting}
      />

      {/* Expiry Date Dialog */}
      {recentlyUploadedDoc && (
        <ExpiryDateDialog
          open={expiryDateDialogOpen}
          onOpenChange={setExpiryDateDialogOpen}
          documentUrl={recentlyUploadedDoc.url}
          documentName={recentlyUploadedDoc.fileName}
          onSave={handleSaveExpiryDate}
          isLoading={savingExpiryDate}
        />
      )}

      {/* Document Downloader Dialog */}
      <ProfileDocumentDownloader
        isOpen={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        documents={documents}
        companyName={profile?.companyName || "Company"}
      />
      
      {/* Fullscreen Document Viewer */}
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
}