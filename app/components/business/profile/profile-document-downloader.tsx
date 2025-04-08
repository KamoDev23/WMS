"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";

interface ProfileDocument {
  id: string;
  type: string;
  fileName: string;
  url: string;
  expiryDate?: string; // ISO string format
}

interface ProfileDocumentDownloaderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documents: ProfileDocument[];
  companyName: string;
}

interface SelectedDocs {
  [key: string]: boolean;
}

const ProfileDocumentDownloader: React.FC<ProfileDocumentDownloaderProps> = ({ 
  isOpen, 
  onOpenChange, 
  documents,
  companyName
}) => {
  const [selectedDocs, setSelectedDocs] = useState<SelectedDocs>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("Preparing files...");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDocs({});
      setSelectAll(false);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Handle select all changes
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    
    const newSelectedDocs: SelectedDocs = {};
    if (checked) {
      // Select all documents
      documents.forEach(doc => {
        newSelectedDocs[doc.id] = true;
      });
    }
    
    setSelectedDocs(newSelectedDocs);
  };

  // Handle individual document selection
  const handleDocumentSelect = (docId: string) => {
    const newSelectedDocs = { ...selectedDocs };
    
    if (newSelectedDocs[docId]) {
      delete newSelectedDocs[docId];
      setSelectAll(false);
    } else {
      newSelectedDocs[docId] = true;
      
      // Check if all documents are now selected
      if (Object.keys(newSelectedDocs).length === documents.length) {
        setSelectAll(true);
      }
    }
    
    setSelectedDocs(newSelectedDocs);
  };

  // Handle download button click
  const handleDownload = async () => {
    const selectedDocuments = documents.filter(doc => selectedDocs[doc.id]);
    
    if (selectedDocuments.length === 0) {
      setError("Please select at least one document to download");
      toast.error("Please select at least one document to download");
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setProgressStatus("Preparing files...");
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Create a root folder with company name
      const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, '_');
      const rootFolder = `${safeCompanyName}_Documents`;
      
      const totalFiles = selectedDocuments.length;
      let completedFiles = 0;
      let failedFiles = 0;
      
      // Download and process files sequentially to show progress
      for (const doc of selectedDocuments) {
        setProgressStatus(`Downloading ${doc.fileName}...`);
        
        try {
          // Fetch the file from the URL
          const response = await fetch(doc.url);
          
          if (!response.ok) {
            throw new Error(`Failed to download ${doc.fileName} (HTTP ${response.status})`);
          }
          
          const blob = await response.blob();
          
          // Create folder structure: root/docType/filename
          const folderPath = `${rootFolder}/${doc.type}/`;
          
          // Add the file to the zip
          zip.file(folderPath + doc.fileName, blob);
          
          // Update progress
          completedFiles++;
          const percent = Math.round((completedFiles / totalFiles) * 80); // Up to 80% for file collection
          setProgress(percent);
        } catch (error) {
          console.error(`Error downloading file ${doc.fileName}:`, error);
          failedFiles++;
        }
      }
      
      if (completedFiles === 0) {
        throw new Error("Failed to download any files. Please try again later.");
      }
      
      if (failedFiles > 0) {
        setError(`${failedFiles} file(s) could not be downloaded and will be missing from the archive.`);
        toast.warning(`${failedFiles} file(s) could not be downloaded and will be missing from the archive.`);
      }
      
      // Generate the zip file with progress updates
      setProgressStatus("Creating zip archive...");
      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      }, (metadata) => {
        // Update progress during zip generation (from 80% to 95%)
        const percent = Math.round(80 + (metadata.percent * 0.15));
        setProgress(percent);
      });
      
      // Final preparation
      setProgress(95);
      setProgressStatus("Finalizing download...");
      
      // Small delay to show completion progress state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save the zip file
      setProgress(100);
      setProgressStatus("Download complete!");
      saveAs(zipBlob, `${safeCompanyName}_Documents.zip`);
      
      // Set success message
      setSuccessMessage(`Successfully downloaded ${completedFiles} document(s).`);
      toast.success(`Successfully downloaded ${completedFiles} document(s).`);
      
      // Reset the download dialog after a delay
      setTimeout(() => {
        if (completedFiles === totalFiles && failedFiles === 0) {
          onOpenChange(false); // Close dialog if everything was successful
        } else {
          setLoading(false); // Just enable the button to try again
        }
      }, 2500);
    } catch (error) {
      console.error("Error creating zip file:", error);
      const errorMessage = error instanceof Error ? error.message : "There was an error creating the download. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Get the total count of selected documents
  const selectedCount = Object.keys(selectedDocs).length;

  // Group documents by type
  const groupedByType = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, ProfileDocument[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if not in the middle of downloading
      if (!loading || progress === 100) {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Download Company Documents</DialogTitle>
          <DialogDescription>
            Select the documents you want to download. Files will be organized by document type.
          </DialogDescription>
        </DialogHeader>

        {successMessage && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription className="text-green-600">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {documents.length === 0 && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-600">No Documents</AlertTitle>
            <AlertDescription className="text-blue-600">
              There are no documents available for your company.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-2 py-4">
          <Checkbox 
            id="selectAll" 
            checked={selectAll}
            onCheckedChange={handleSelectAllChange}
            disabled={documents.length === 0}
          />
          <label
            htmlFor="selectAll"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select All Documents ({documents.length})
          </label>
        </div>

        <ScrollArea className="max-h-[50vh]">
          {Object.keys(groupedByType).length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No documents available.
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {Object.entries(groupedByType).map(([docType, docs]) => (
                <div key={docType} className="space-y-2">
                  <h3 className="text-sm font-semibold">{docType} ({docs.length})</h3>
                  {docs.map((doc) => (
                    <Card key={doc.id} className="mb-2">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={`doc-${doc.id}`}
                            checked={!!selectedDocs[doc.id]}
                            onCheckedChange={() => handleDocumentSelect(doc.id)}
                            className="mt-1"
                          />
                          <div className="grid gap-1.5">
                            <label
                              htmlFor={`doc-${doc.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {doc.fileName}
                            </label>
                            {doc.expiryDate && (
                              <div className="text-xs text-muted-foreground">
                                Expires: {format(new Date(doc.expiryDate), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {loading && (
          <div className="py-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progressStatus}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 w-full" />
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {selectedCount} of {documents.length} documents selected
          </div>
          <Button 
            onClick={handleDownload} 
            disabled={loading || selectedCount === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Selected
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDocumentDownloader;