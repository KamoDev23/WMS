"use client";
import React, { useEffect, useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveProfileData, uploadProfileDocument, deleteProfileDocument, fetchProfileData, fetchProfileDocuments } from "@/lib/profile-utils";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase/firebase-config";
import { getDoc, doc } from "firebase/firestore";
import { Loader2, AlertTriangle, FileText } from "lucide-react";
 import { toast } from "sonner";
import DeleteConfirmationDialog from "@/app/components/customs/delete-confirmation-dialog";

interface ProfileData {
  companyName: string;
  address: string;
  companyEmail?: string;
  phoneNumber?: string; 
  websiteUrl?: string;
  companyLogo?: string;
  tagline?: string;
}

interface ProfileDocument {
  id: string;
  type: string;
  fileName: string;
  url: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Document states
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategories, setDocumentCategories] = useState<string[]>([]);
  const [docType, setDocType] = useState<string>("");

  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, fileName: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


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
        console.log("Merchant Code:", merchantCode);
  
        // Fetch Profile Data
        const profileData = await fetchProfileData(merchantCode);
        setProfile({
          companyName: profileData?.companyName || "",
          address: profileData?.address || "",
          companyEmail: profileData?.companyEmail || "",
          phoneNumber: profileData?.phoneNumber || "",
          websiteUrl: profileData?.websiteUrl || "",
          companyLogo: profileData?.companyLogo || "",
          tagline: profileData?.tagline || "",
        });
  
        // Fetch Documents
        setLoadingDocuments(true);
        const docs = await fetchProfileDocuments(merchantCode);
        setDocuments(docs);
  
        // Now fetch document categories
        const merchantDocRef = doc(db, "merchants", merchantCode);
        const merchantSnap = await getDoc(merchantDocRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          const categories = data.companyDocumentOptions || [];
          setDocumentCategories(categories);
          if (!docType && categories.length > 0) {
            setDocType(categories[0]);
          }
        } else {
          setDocumentCategories([]);
        }
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
    console.log("Saving profile:", profile);
    console.log("Merchant Code:", merchantCode);
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
      const newDoc = await uploadProfileDocument(merchantCode, selectedFile, docType);
      if (newDoc) {
        setDocuments((prev) => [...prev, newDoc]);
        toast.success("Document uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
      setSelectedFile(null);
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

  const handleViewDocument = (url: string) => {
    window.open(url, "_blank");
  };

  // Set up drop zone for file upload.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
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

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle> 
          </CardHeader>
          <CardContent>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="websiteUrl" className="block text-sm font-medium">
            Website URL
          </Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            value={profile?.websiteUrl}
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
          </CardContent>
        </Card>
         
         
      </form>
      )}

      <Separator />

      <h3 className="text-xl font-bold mb-2">Documents</h3>
        {/* Upload New Document Section */}

        {/* Documents Upload Section */}
      {loadingDocuments ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <div>
        {/* Document List */}
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
                      <p className="text-xs text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(doc.url)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(doc.id, doc.fileName)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
       )}

        <Card className="p-4 mt-6">
          <h3 className="text-lg font-medium mb-4">Upload New Document</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category-select" className="block mb-2 text-sm font-medium">
                Document Category
              </Label>
              <Select value={docType} onValueChange={(value) => setDocType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {documentCategories.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600">
                  File selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Single Drop Zone */}
          <div
            {...getRootProps()}
            className={`flex h-52 w-full items-center justify-center rounded border-2 border-dashed p-4 mt-4 ${
              isDragActive ? "bg-muted" : ""
            }`}
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

          <div className="flex justify-end mt-4">
          <Button onClick={handleUploadDocument} disabled={!selectedFile || !docType || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Document"
            )}
          </Button>
          </div>
        </Card>
        
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        documentName={documentToDelete?.fileName || ""}
        onConfirm={handleDeleteDocument}
        isDeleting={isDeleting}
      />
    </div>
  );
}