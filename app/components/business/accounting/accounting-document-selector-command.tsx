"use client";
import React from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Define the main categories as a constant
export type AccountingCategory =
  | "Recurring Expenditure"
  | "Contingent Expenses"
  | "Compensation"
  | "Bank Statements"
  | "Income (Remittances)"
  | "Fuel & Maintenance";

const MAIN_CATEGORIES: AccountingCategory[] = [
  "Recurring Expenditure",
  "Contingent Expenses",
  "Compensation",
  "Bank Statements",
  "Income (Remittances)",
  "Fuel & Maintenance",
];

interface AccountingUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  selectedMainCategory: string;
  setSelectedMainCategory: (category: string) => void;
  documentLabel: string;
  setDocumentLabel: (label: string) => void;
  onUpload: () => Promise<void>;
  loading: boolean;
}

const AccountingUploadDialog: React.FC<AccountingUploadDialogProps> = ({
  open,
  onOpenChange,
  selectedFile,
  setSelectedFile,
  selectedMainCategory,
  setSelectedMainCategory,
  documentLabel,
  setDocumentLabel,
  onUpload,
  loading,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        
        // Auto-populate the document label with the filename (without extension)
        if (!documentLabel) {
          const fileName = acceptedFiles[0].name;
          const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf("."));
          setDocumentLabel(nameWithoutExtension);
        }
      }
    },
    multiple: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
          <DialogDescription>Upload an accounting document for your company.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Main Category Select - Using the fixed categories */}
          <div>
            <Label htmlFor="main-category-select" className="block mb-2 text-sm font-medium">
              Main Category
            </Label>
            <Select
              value={selectedMainCategory}
              onValueChange={(value) => {
                setSelectedMainCategory(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a main category" />
              </SelectTrigger>
              <SelectContent>
                {MAIN_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Document Label Input - Replacing subcategory */}
          <div className="mb-6">
            <Label htmlFor="document-label" className="block mb-2 text-sm font-medium">
              Document Label
            </Label>
            <Input
              id="document-label"
              value={documentLabel}
              onChange={(e) => setDocumentLabel(e.target.value)}
              placeholder="Enter a label for this document"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be used to name your document in the format: "{documentLabel || 'label'}.pdf"
            </p>
          </div>
          
           
          
          {/* Dropzone */}
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
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={onUpload} 
            disabled={!selectedFile || !selectedMainCategory || !documentLabel.trim() || loading}
          >
            {loading ? (
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
  );
};

export default AccountingUploadDialog;