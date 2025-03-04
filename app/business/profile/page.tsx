"use client";
import React, { useState } from "react";
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

interface ProfileData {
  companyName: string;
  address: string;
}

interface ProfileDocument {
  id: string;
  type: "BEE Document" | "Tax Certification" | "Insurance Document" | "Other";
  fileName: string;
  url: string;
}

export default function ProfilePage() {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileData>({
    companyName: "Rocky Rock Trading - Workshop Management",
    address: "123 Workshop Road",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditMode(false);
    // Save profile data to Firebase if needed.
    alert("Profile saved!");
  };

  // Dummy state for documents (replace with Firebase integration)
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<
    "BEE Document" | "Tax Certification" | "Insurance Document" | "Other"
  >("BEE Document");

  // Dummy upload handler – in a real app, integrate with Firebase Storage/Firestore.
  const handleUploadDocument = () => {
    if (!selectedFile) return;
    // For sequential numbering, count current documents of this type.
    const count = documents.filter((doc) => doc.type === docType).length + 1;
    const newDoc: ProfileDocument = {
      id: Math.random().toString(36).substr(2, 9),
      type: docType,
      fileName: `${docType} (${count}) - ${selectedFile.name}`,
      url: URL.createObjectURL(selectedFile), // In a real app, this will be the download URL.
    };
    setDocuments((prev) => [...prev, newDoc]);
    setSelectedFile(null);
  };

  // Delete a document from the list
  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  // View a document (open in new tab)
  const handleViewDocument = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 p-4">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profile</h2>
        {editMode ? (
          <Button onClick={() => setEditMode(false)} variant="outline">
            Cancel
          </Button>
        ) : (
          <Button onClick={() => setEditMode(true)}>Edit</Button>
        )}
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="space-y-4 p-4 shadow rounded bg-white"
      >
        <div>
          <Label htmlFor="companyName" className="block text-sm font-medium">
            Company Name
          </Label>
          <Input
            id="companyName"
            name="companyName"
            value={profile.companyName}
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
            value={profile.address}
            onChange={handleProfileChange}
            readOnly={!editMode}
            className="mt-1"
          />
        </div>
        {editMode && <Button type="submit">Save Profile</Button>}
      </form>

      {/* Documents Upload Section */}
      <div className="p-4 shadow rounded bg-white">
        <h3 className="text-xl font-bold mb-2">Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="fileUpload" className="block text-sm font-medium">
              Upload Document
            </Label>
            <Input
              id="fileUpload"
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="mt-1"
            />
          </div>
          {/* Document Type Select */}
          <div>
            <Label className="block text-sm font-medium">Document Type</Label>
            <Select
              value={docType}
              onValueChange={(value) => setDocType(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="BEE Document">BEE Document</SelectItem>
                  <SelectItem value="Tax Certification">
                    Tax Certification
                  </SelectItem>
                  <SelectItem value="Insurance Document">
                    Insurance Document
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {/* Upload Button */}
          <div className="flex items-end">
            <Button onClick={handleUploadDocument} disabled={!selectedFile}>
              Upload
            </Button>
          </div>
        </div>
        {/* Document List */}
        <div className="mt-4 space-y-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
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
                      onClick={() => handleDeleteDocument(doc.id)}
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
    </div>
  );
}
