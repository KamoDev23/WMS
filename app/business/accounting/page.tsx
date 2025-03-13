"use client";
import { PlusIcon, DollarSign, ShieldCheckIcon, CheckCircle, FileText, BellIcon, LifeBuoyIcon, Loader2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/app/components/customs/date-picker-with-range";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/firebase/firebase-config";
import { Card } from "@/components/ui/card";

// Import dialog components (adjust if needed)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/context/auth-context";
import { Separator } from "@/components/ui/separator";

export type AccountingCategory =
  | "Recurring Expenditure"
  | "Contingent Expenses"
  | "Compensation"
  | "Bank Statements"
  | "Income (Remittances)"
  | "Fuel & Maintenance";

export interface AccountingDocument {
  id: string;
  category: AccountingCategory;
  fileName: string;
  url: string;
  uploadedAt: Date;
  amount?: number;
  docType?: string;
}

const categoryOptions: AccountingCategory[] = [
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
  
  // Date range state
  const [dateRange, setDateRange] = useState<
    { from: Date; to: Date } | undefined
  >(undefined);
  const [documents, setDocuments] = useState<AccountingDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Centralized upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    AccountingCategory | ""
  >("");

  // New state for dialog
  const [showAmountDialog, setShowAmountDialog] = useState<boolean>(false);
  const [currentDoc, setCurrentDoc] = useState<AccountingDocument | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");

  const [accountingCategoriesMapping, setAccountingCategoriesMapping] = useState<Record<string, string[]>>({});
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  const categoryIcons: Record<string, React.ComponentType<{ size?: number }>> = {
    "Recurring Expenditure": DollarSign,
    "Contingent Expenses": ShieldCheckIcon,
    "Compensation": CheckCircle,
    "Bank Statements": FileText,
    "Income (Remittances)": BellIcon,
    "Fuel & Maintenance": LifeBuoyIcon,
  };


    // Drag and drop functionality using react-dropzone
    const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    }, []);
  
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false,
    });

    // Fetch the accounting categories mapping from Firestore when merchantCode is available
    useEffect(() => {
      if (!merchantCode) return;
      const fetchAccountingCategoriesMapping = async () => {
        try {
          const merchantDocRef = doc(db, "merchants", merchantCode);
          const merchantSnap = await getDoc(merchantDocRef);
          if (merchantSnap.exists()) {
            const data = merchantSnap.data();
            // Expecting the mapping to be stored as an object: { [mainCategory: string]: string[] }
            const mapping: Record<string, string[]> = data.
            accountingDocumentOptions  || {};
            setAccountingCategoriesMapping(mapping);
            const mainCats = Object.keys(mapping);
            if (mainCats.length > 0) {
              setSelectedMainCategory(mainCats[0]);
              if (mapping[mainCats[0]] && mapping[mainCats[0]].length > 0) {
                setSelectedSubCategory(mapping[mainCats[0]][0]);
              }
            }
          } else {
            setAccountingCategoriesMapping({});
          }
        } catch (error) {
          console.error("Error fetching accounting categories mapping:", error);
          setAccountingCategoriesMapping({});
        }
      };
      fetchAccountingCategoriesMapping();
    }, [merchantCode]);

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
        const uploadedAt =
          data.uploadedAt && (data.uploadedAt as any).toDate
            ? (data.uploadedAt as any).toDate()
            : new Date(data.uploadedAt);
  
        docs.push({ id: docSnap.id, ...data, uploadedAt });
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
  }, [dateRange?.from, dateRange?.to]);

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !merchantCode || !selectedMainCategory || !selectedSubCategory) {
      console.error("Missing required fields: Merchant Code, File, Main Category, or Subcategory.");
      return;
    }
    setLoading(true);
    try {
      const timestamp = Date.now();
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf("."));
      const count =
        documents.filter((doc) => doc.category === selectedMainCategory).length + 1;
      const newFileName = `${selectedMainCategory} (${selectedSubCategory})${ext}`;
      // Combine the two selections to form the final document type.
      const finalDocType = `${selectedMainCategory} - ${selectedSubCategory}`;
      
      // Upload file to Storage under a merchant-specific folder.
      const storageRef = ref(
        storage,
        `merchants/${merchantCode}/documets/${selectedMainCategory}/${newFileName}`
      );
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(snapshot.ref);
    
      const docData = {
        category: selectedMainCategory,
        fileName: newFileName,
        url,
        uploadedAt: new Date(),
      };
    
      // Save document data to Firestore under merchant-specific path.
      const docRef = await addDoc(
        collection(db, "merchants", merchantCode, "accountingDocuments"),
        { ...docData, docType: finalDocType }
      );
    
      const newDoc: AccountingDocument = {
        id: docRef.id,
        ...docData,
        docType: finalDocType,
        category: selectedMainCategory as AccountingCategory,
        uploadedAt: new Date(),
      };
    
      setDocuments((prev) => [...prev, newDoc]);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setLoading(false);
      setSelectedFile(null);
      // Optionally, clear file input element if needed
    }
  };
  
  


  // Handle confirming the invoice amount
  const handleConfirmAmount = async () => {
    if (!currentDoc || !merchantCode) return;
  
    try {
      const amountValue = parseFloat(invoiceAmount);
      const docRef = doc(
        db,
        "merchants",
        merchantCode,
        "accountingDocuments",
        currentDoc.id
      );
  
      await updateDoc(docRef, { amount: amountValue });
  
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === currentDoc.id ? { ...d, amount: amountValue } : d
        )
      );
  
      setShowAmountDialog(false);
      setCurrentDoc(null);
      setInvoiceAmount("");
      setSelectedFile(null);
      setSelectedCategory("");
  
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error updating document with amount:", error);
    }
  };

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    if (!merchantCode) return;
  
    setLoading(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "merchants", merchantCode, "accountingDocuments", docId));
  
      // Delete from Storage
      const storageRef = ref(storage, `merchants/${merchantCode}/accounting/${selectedCategory}/${fileName}`);
      await deleteObject(storageRef);
  
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setLoading(false);
    }
  };
  
  

  // Group documents by category
  const groupedDocs = documents.reduce((acc, doc) => {
    (acc[doc.category] = acc[doc.category] || []).push(doc);
    return acc;
  }, {} as Record<AccountingCategory, AccountingDocument[]>);

  return (
    <section className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold">Accounting</h2>
        <p className="text-muted-foreground">
          Add, remove, or edit your employees' details.
        </p>
      </div>

      <Separator />
      
      {/* Date Range Picker */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <DatePickerWithRange value={dateRange} onSelect={setDateRange} />
      </div>

      {/* Accordion for documents */}
      <div className="space-y-4">
  {categoryOptions.map((category) => {
    const docsForCategory = groupedDocs[category] || [];
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
            {/* <PlusIcon
              size={16}
              className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
              aria-hidden="true"
            /> */}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground ml-3 pl-10 pb-2">
            {docsForCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents uploaded for this section.
              </p>
            ) : (
              docsForCategory.map((doc, index) => (
                <Card key={doc.id} className="p-4 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {doc.fileName}
                      {doc.amount !== undefined && ` - ${doc.amount}`}
                    </div>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          handleDeleteDocument(doc.id, doc.fileName);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  })}
      </div>

      {/* Upload Section */}
      <Card className="p-4">
  <h3 className="text-lg font-medium">Upload New Document</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Main Category Select */}
    <div>
      <Label htmlFor="main-category-select" className="block mb-2 text-sm font-medium">
        Main Category
      </Label>
      <Select
        value={selectedMainCategory}
        onValueChange={(value) => {
          setSelectedMainCategory(value);
          // When main category changes, update the subcategory if available
          if (accountingCategoriesMapping[value] && accountingCategoriesMapping[value].length > 0) {
            setSelectedSubCategory(accountingCategoriesMapping[value][0]);
          } else {
            setSelectedSubCategory("");
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a main category" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(accountingCategoriesMapping).map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {/* Subcategory Select */}
    <div>
      <Label htmlFor="sub-category-select" className="block mb-2 text-sm font-medium">
        Subcategory
      </Label>
      <Select
        value={selectedSubCategory}
        onValueChange={(value) => setSelectedSubCategory(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a subcategory" />
        </SelectTrigger>
        <SelectContent>
          {selectedMainCategory &&
            accountingCategoriesMapping[selectedMainCategory]?.map((subcat) => (
              <SelectItem key={subcat} value={subcat}>
                {subcat}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  </div>
  {selectedFile && (
    <p className="mt-2 text-sm text-green-600">
      File selected: {selectedFile.name}
    </p>
  )}
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
    <Button
      onClick={handleUpload}
      disabled={!selectedFile || !selectedMainCategory || !selectedSubCategory || loading}
    >
      {loading ? (
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


      {/* Dialog to prompt for invoice amount and show document */}
      {showAmountDialog && currentDoc && (
        <Dialog open={showAmountDialog} onOpenChange={setShowAmountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Invoice Amount</DialogTitle>
              <DialogDescription>
                Please review the document below and enter the invoice amount.
              </DialogDescription>
            </DialogHeader>
            {/* Iframe to display the document */}
            <div className="mb-4">
              <iframe
                src={currentDoc.url}
                title="Uploaded Document"
                className="w-full h-64 border"
              />
            </div>
            <div className="space-y-4 py-4">
              <Label
                className="block text-sm font-medium"
                htmlFor="invoice-amount"
              >
                Invoice Amount
              </Label>
              <Input
                id="invoice-amount"
                type="number"
                placeholder="Enter amount"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmAmount}>Confirm</Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
