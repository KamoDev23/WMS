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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { AccountingDocument } from "@/app/business/accounting/page";
import { toast } from "sonner";

// Import types from the AccountingPage
 
interface DocumentDownloaderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documents: AccountingDocument[];
  dateRange: { from: Date; to: Date } | undefined;
}

interface GroupedDocs {
  [key: string]: AccountingDocument[];
}

interface SelectedDocs {
  [key: string]: boolean;
}

const DocumentDownloader: React.FC<DocumentDownloaderProps> = ({ 
  isOpen, 
  onOpenChange, 
  documents, 
  dateRange 
}) => {
  const [selectedDocs, setSelectedDocs] = useState<SelectedDocs>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [groupedDocs, setGroupedDocs] = useState<GroupedDocs>({});
  const [progressStatus, setProgressStatus] = useState<string>("Preparing files...");
  const [progress, setProgress] = useState<number>(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDocs({});
      setSelectAll(false);
      
      // Group documents by category
      const grouped = documents.reduce<GroupedDocs>((acc, doc) => {
        if (!acc[doc.category]) acc[doc.category] = [];
        acc[doc.category].push(doc);
        return acc;
      }, {});
      
      setGroupedDocs(grouped);
    }
  }, [isOpen, documents]);

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
      alert("Please select at least one document to download");
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setProgressStatus("Preparing files...");
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Determine zip file name
      let zipFileName: string;
      if (dateRange && dateRange.from && dateRange.to) {
        const fromMonth = format(dateRange.from, "MMM");
        const fromYear = format(dateRange.from, "yyyy");
        const toMonth = format(dateRange.to, "MMM");
        const toYear = format(dateRange.to, "yyyy");
        
        if (fromMonth === toMonth && fromYear === toYear) {
          zipFileName = `${fromMonth}_${fromYear}_Documents`;
        } else {
          zipFileName = `${fromMonth}_${fromYear}_to_${toMonth}_${toYear}_Documents`;
        }
      } else {
        zipFileName = `Accounting_Documents_${format(new Date(), "yyyy-MM-dd")}`;
      }
      
      const totalFiles = selectedDocuments.length;
      let completedFiles = 0;
      
      // Download and process files sequentially to show progress
      for (const doc of selectedDocuments) {
        setProgressStatus(`Downloading ${doc.label || doc.fileName}...`);
        
        try {
          // Fetch the file from the URL
          const response = await fetch(doc.url);
          const blob = await response.blob();
          
          // Determine the month folder based on transaction date
          let monthFolder: string;
          if (doc.transactionDate) {
            // Use the transaction date's month and year
            monthFolder = format(doc.transactionDate, "MMM_yyyy");
          } else if (doc.uploadedAt) {
            // Fallback to upload date if transaction date isn't available
            monthFolder = format(doc.uploadedAt, "MMM_yyyy");
          } else {
            // If no date is available, use "Undated" folder
            monthFolder = "Undated";
          }
          
          // Create folder structure: month/category/filename
          const folderPath = `${monthFolder}/${doc.category}/`;
          const fileName = doc.label || doc.fileName;
          
          // Add the file to the zip
          zip.file(folderPath + fileName, blob);
          
          // Update progress
          completedFiles++;
          const percent = Math.round((completedFiles / totalFiles) * 80); // Up to 80% for file collection
          setProgress(percent);
        } catch (error) {
          console.error(`Error downloading file ${doc.fileName}:`, error);
        }
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
      saveAs(zipBlob, `${zipFileName}.zip`);
      toast.success("Download complete!");
    } catch (error) {
      console.error("Error creating zip file:", error);
      toast.error("An error occurred while preparing the download. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get the total count of selected documents
  const selectedCount = Object.keys(selectedDocs).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Download Documents</DialogTitle>
          <DialogDescription>
            Select the documents you want to download. Files will be organized by category in a zip folder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox 
            id="selectAll" 
            checked={selectAll}
            onCheckedChange={handleSelectAllChange}
          />
          <label
            htmlFor="selectAll"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select All Documents ({documents.length})
          </label>
        </div>

        <ScrollArea className="max-h-[50vh]">
          {Object.keys(groupedDocs).length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No documents available for the selected date range.
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.keys(groupedDocs).map((category) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2">
                      <span>{category}</span>
                      <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                        {groupedDocs[category].length}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {groupedDocs[category].map((doc) => (
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
                                {doc.label || doc.fileName}
                              </label>
                              <div className="text-xs text-muted-foreground">
                                {doc.transactionDate && (
                                  <div>Date: {format(doc.transactionDate, "MMM d, yyyy")}</div>
                                )}
                                {doc.amount !== undefined && (
                                  <div>Amount: R{doc.amount.toFixed(2)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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

export default DocumentDownloader;