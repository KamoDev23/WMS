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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveProfileData, uploadProfileDocument, deleteProfileDocument, fetchProfileData, fetchProfileDocuments } from "@/lib/profile-utils";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase/firebase-config";
import { getDoc, doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

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
  type: "BEE Document" | "Tax Certification" | "Insurance Document" | "Other";
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

  // Dummy state for documents (replace with Firebase integration)
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategories, setDocumentCategories] = useState<string[]>([]);
  const [docType, setDocType] = useState<string>("");


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
      [name]: value, // No need for `|| ""` because defaults are already handled
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
      console.log("Profile saved:", profile);
      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSavingProfile(false);
    }
  };
  
  

  const handleUploadDocument = async () => {
    if (!selectedFile || !merchantCode) return;
    setUploading(true);

    try {
      const newDoc = await uploadProfileDocument(merchantCode, selectedFile, docType);
      if (newDoc) {
        setDocuments((prev) => [...prev, newDoc]);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    if (!merchantCode) return;

    setLoadingDocuments(true);
    try {
      await deleteProfileDocument(merchantCode, docId, fileName);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setLoadingDocuments(false);
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
              {savingProfile ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Profile"}
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
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <h3 className="text-xl font-bold mb-4">Company Details</h3>
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
          <Label htmlFor="tagline" className="block text-sm font-medium">
            Tagline / Slogan
          </Label>
          <Input
            id="tagline"
            name="tagline"
            value={profile?.tagline}
            onChange={handleProfileChange}
            readOnly={!editMode}
            className="mt-1"
          />
        </div>
        </div>
        
        
       
      </form>
      )}

      <Separator />

      <h3 className="text-xl font-bold mb-2">Documents</h3>
        {/* Upload New Document Section */}

        {/* Documents Upload Section */}
      {loadingDocuments ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
      <div>
        

        {/* Document List */}
        <div className="mt-4 space-y-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            documents.map((doc, index) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {doc.fileName} ({index + 1})
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
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
                      onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
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

        <Card className="p-4">
          <h3 className="text-lg font-medium">Upload New Document</h3>
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
            className={`flex h-52 w-full items-center justify-center rounded border-2 border-dashed p-4 ${
              isDragActive ? "bg-gray-100" : ""
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

          <div className="flex justify-end">
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
        


      
    </div>
  );
}
