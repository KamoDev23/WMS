"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/firebase/firebase-config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

// Define the employee interface with extra fields
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
}

// Document interface for employee documents
interface UploadedDocument {
  id: string;
  fileName: string;
  url: string;
  docType: "ID Copy" | "Employment Contract" | "Proof of Address" | "Other";
  employeeId: string;
}

export default function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Document states
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<
    "ID Copy" | "Employment Contract" | "Proof of Address" | "Other"
  >("ID Copy");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const docTypes: (
    | "ID Copy"
    | "Employment Contract"
    | "Proof of Address"
    | "Other"
  )[] = ["ID Copy", "Employment Contract", "Proof of Address", "Other"];

  // Fetch employee details from Firestore
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const docRef = doc(db, "businessEmployees", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployee({ id, ...docSnap.data() } as Employee);
        } else {
          router.push("/business/employee-management");
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
      }
    };

    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "employeeDocuments")
        );
        const fetchedDocs: UploadedDocument[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<UploadedDocument, "id">;
          if (data.employeeId === id) {
            fetchedDocs.push({ id: docSnap.id, ...data });
          }
        });
        setDocuments(fetchedDocs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchEmployee();
    fetchDocuments();
  }, [id, router]);

  // Handle input changes for employee details
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!employee) return;
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  // Handle saving changes to employee details
  const handleSave = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const docRef = doc(db, "businessEmployees", id);
      await updateDoc(docRef, { ...employee });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating employee:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload for employee documents
  const handleUpload = async () => {
    if (!selectedFile || !employee) return;
    setLoading(true);
    try {
      const fileRef = ref(
        storage,
        `employees/${employee.id}/${docType}-${Date.now()}`
      );
      const snapshot = await uploadBytes(fileRef, selectedFile);
      const url = await getDownloadURL(snapshot.ref);

      const docData = {
        employeeId: employee.id,
        docType,
        fileName: selectedFile.name,
        url,
      };
      const docRef = await addDoc(collection(db, "employeeDocuments"), docData);
      const newDoc: UploadedDocument = { id: docRef.id, ...docData };
      setDocuments((prev) => [...prev, newDoc]);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 p-6 shadow rounded bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Details</h2>
        <Button variant="outline" onClick={() => setEditMode(!editMode)}>
          {editMode ? "Cancel" : "Edit"}
        </Button>
      </div>

      {employee && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={employee.firstName}
                onChange={handleChange}
                disabled={!editMode}
                className="mt-1"
              />
            </div>
            {/* Last Name */}
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={employee.lastName}
                onChange={handleChange}
                disabled={!editMode}
                className="mt-1"
              />
            </div>
            {/* ID Number */}
            <div>
              <Label htmlFor="idNumber" className="block text-sm font-medium">
                ID Number
              </Label>
              <Input
                id="idNumber"
                name="idNumber"
                value={employee.idNumber}
                onChange={handleChange}
                disabled={!editMode}
                className="mt-1"
              />
            </div>
            {/* Age */}
            <div>
              <Label htmlFor="age" className="block text-sm font-medium">
                Age
              </Label>
              <Input
                id="age"
                name="age"
                value={employee.age}
                onChange={handleChange}
                disabled={!editMode}
                className="mt-1"
              />
            </div>
            {/* Gender */}
            <div>
              <Label htmlFor="gender" className="block text-sm font-medium">
                Gender
              </Label>
              <Select
                value={employee.gender}
                onValueChange={(val) =>
                  setEmployee({ ...employee, gender: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Role */}
            <div>
              <Label htmlFor="role" className="block text-sm font-medium">
                Role
              </Label>
              <Input
                id="role"
                name="role"
                value={employee.role}
                onChange={handleChange}
                disabled={!editMode}
                className="mt-1"
              />
            </div>
            {/* Date of Hire */}
            <div>
              <Label htmlFor="dateOfHire" className="block text-sm font-medium">
                Date of Hire
              </Label>
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
            {/* Phone Number */}
            <div>
              <Label
                htmlFor="phoneNumber"
                className="block text-sm font-medium"
              >
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={employee.phoneNumber}
                onChange={handleChange}
                disabled={!editMode}
                className="mt-1"
              />
            </div>
            {/* Email */}
            <div>
              <Label htmlFor="email" className="block text-sm font-medium">
                Email
              </Label>
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
            {/* Address */}
            <div>
              <Label htmlFor="address" className="block text-sm font-medium">
                Address
              </Label>
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
          {editMode && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </>
      )}

      {/* Document Upload Section */}
      <div className="mt-6 p-4 shadow rounded bg-white">
        <h3 className="text-xl font-bold mb-2">Employee Documents</h3>
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
              onValueChange={(value) =>
                setDocType(
                  value as
                    | "ID Copy"
                    | "Employment Contract"
                    | "Proof of Address"
                    | "Other"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Document Type" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Upload Button */}
          <div className="flex items-end">
            <Button onClick={handleUpload} disabled={!selectedFile}>
              Upload
            </Button>
          </div>
        </div>

        {/* Display Document List */}
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
                    <p className="text-xs text-muted-foreground">
                      {doc.docType}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Delete document logic here
                      }}
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
    </section>
  );
}
