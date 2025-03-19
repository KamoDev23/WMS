"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
  SelectGroup,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { Separator } from "@/components/ui/separator";
import { Loader2, CircleX, FileText, HomeIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
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
  deleteEmployeeDocument,
  fetchEmployeeById,
  fetchEmployeeDocuments,
  fetchUserMerchantCode,
  saveEmployee,
  uploadEmployeeDocument,
} from "@/lib/employee-utils";
import { set } from "date-fns";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

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
  docType: "ID Copy" | "Employment Contract" | "Proof of Address" | "Other";
  employeeId: string;
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

  // Document states
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // For document category from merchant doc (dynamically fetched)
  const [documentCategories, setDocumentCategories] = useState<string[]>([]);
  const [docType, setDocType] = useState<string>("");

  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; fileName: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const docTypeOptions = ["ID Copy", "Employment Contract", "Proof of Address", "Other"];



  // Fetch document categories from the merchant document when merchantCode is available
  useEffect(() => {
    if (!merchantCode) return;
    const fetchDocumentCategories = async () => {
      try {
        const merchantDocRef = doc(db, "merchants", merchantCode);
        const merchantSnap = await getDoc(merchantDocRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          const categories = data.employeeDocumentOptions || [];
          setDocumentCategories(categories);
          // Set default if not set
          if (!docType && categories.length > 0) {
            setDocType(categories[0]);
          }
        } else {
          setDocumentCategories([]);
        }
      } catch (error) {
        console.error("Error fetching document categories:", error);
        setDocumentCategories([]);
      }
    };
    fetchDocumentCategories();
  }, [merchantCode]);

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
            await fetchDocuments();
          }
        } catch (error) {
          console.error("Error loading employee data:", error);
        } finally {
          setLoading(false);
        }
      };
  
      loadEmployeeData();
    }, [user, id]);
  
    const fetchDocuments = async () => {
      console.log("Fetching documents...");
      console.log("Merchant code:", merchantCode);
      console.log("Employee ID:", employee?.id);
      if (!merchantCode || !employee?.id) return;
  
      setLoadingDocuments(true);
      try {
        const docs = await fetchEmployeeDocuments(merchantCode, employee.id);
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoadingDocuments(false);
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
    setSavingEmployeeDetails(false)
    setEditMode(false);
  };

  // Handle file upload for employee documents
  const handleUploadDocument = async () => {
    if (!selectedFile || !merchantCode || !employee) return;
    setUploadingDoc(true);
    try {
      const newDoc = await uploadEmployeeDocument(
        merchantCode,
        employee.id,
        selectedFile,
        docType
      );
      if (newDoc) {
        setDocuments((prev) => [...prev, newDoc]);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploadingDoc(false);
      setSelectedFile(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!merchantCode || !employee || !docToDelete) return;
    setDeletingDoc(true);
    try {
      await deleteEmployeeDocument(merchantCode, employee.id, docToDelete.id, docToDelete.fileName);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docToDelete.id));
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setDeletingDoc(false);
      setShowDeleteDialog(false);
      setDocToDelete(null);
    }
  };

  const handleViewDocument = (url: string) => {
    window.open(url, "_blank");
  };

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    multiple: false,
  });

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

      {/* Document Upload Section */}
      <h3 className="text-xl font-bold mb-2">Documents</h3>

      {/* Documents List Section */}
      {loadingDocuments ? (
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
            documents.map((doc, index) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {doc.fileName}  
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.docType}</p>
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
                      onClick={() => {
                        setDocToDelete({ id: doc.id, fileName: doc.fileName });
                        setShowDeleteDialog(true);
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
          className={`flex h-52 w-full items-center justify-center rounded border-2 border-dashed p-4 mt-4 ${
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
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={handleUploadDocument} disabled={!selectedFile || !docType || loading}>
            {uploadingDoc ? (
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
    </section>
  );
}
