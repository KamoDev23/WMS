"use client";
import React, { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import EmployeeDocumentSelector from "./employee-document-selector-command";
 
interface EmployeeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: string;
  setDocType: (value: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onConfirm: () => void;
  uploading: boolean;
  merchantCode: string;
  hasExpiry: boolean;
  setHasExpiry: (value: boolean) => void;
}

const EmployeeUploadDialog: React.FC<EmployeeUploadDialogProps> = ({
  open,
  onOpenChange,
  docType,
  setDocType,
  selectedFile,
  setSelectedFile,
  onConfirm,
  uploading,
  merchantCode,
  hasExpiry,
  setHasExpiry
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    multiple: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Employee Document</DialogTitle>
          <DialogDescription>Upload a new document for this employee.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Document Category Selection */}
          <div>
            <Label className="block mb-2 text-sm font-medium">
              Document Category
            </Label>
            <EmployeeDocumentSelector 
              merchantCode={merchantCode}
              selected={docType}
              onSelect={setDocType}
              hasExpiry={hasExpiry}
              setHasExpiry={setHasExpiry}
            />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={uploading || !selectedFile || !docType}>
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
  );
};

export default EmployeeUploadDialog;