"use client";
import React, { useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileText } from "lucide-react";

interface UploadedDocument {
  id: string;
  fileName: string;
  url: string;
  docType: string;
  employeeId: string;
  expiryDate?: string; // ISO string format
}

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: UploadedDocument | null;
  docType: string;
  setDocType: (type: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  hasExpiry: boolean;
  setHasExpiry: (hasExpiry: boolean) => void;
  onConfirm: () => Promise<void>;
  uploading: boolean;
}

const EditDocumentDialog: React.FC<EditDocumentDialogProps> = ({
  open,
  onOpenChange,
  document,
  docType,
  setDocType,
  selectedFile,
  setSelectedFile,
  hasExpiry,
  setHasExpiry,
  onConfirm,
  uploading,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    multiple: false,
  });

  // Set document type from existing document when dialog opens
  useEffect(() => {
    if (open && document) {
      setDocType(document.docType);
      setHasExpiry(!!document.expiryDate);
    }
  }, [open, document, setDocType, setHasExpiry]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Document</DialogTitle>
          <DialogDescription>
            Upload a new file to replace the current document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Input
                id="documentType"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="e.g., ID Card, Resume, Contract"
                disabled={true} // Cannot change document type when updating
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasExpiry"
                  checked={hasExpiry}
                  onCheckedChange={(checked) => setHasExpiry(!!checked)}
                />
                <Label htmlFor="hasExpiry">This document has an expiry date</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll be prompted to set the expiry date after upload.
              </p>
            </div>
            
            {/* File upload dropzone */}
            <div {...getRootProps()} className="border-2 border-dashed rounded-md p-6 cursor-pointer">
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary/70" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : isDragActive ? (
                <div className="text-center">
                  <p>Drop the file here...</p>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Drag & drop a file here, or click to select</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PDF, DOC, DOCX, JPG, PNG
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Update Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDocumentDialog;