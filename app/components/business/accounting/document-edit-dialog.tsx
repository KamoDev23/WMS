"use client";
import React, { useState, useEffect } from "react";
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
import { Loader2, CalendarIcon, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import FullscreenDocumentViewer from "../components/fullscreen-document-viewer";
 
interface AccountingDocument {
  id: string;
  fileName: string;
  url: string;
  category: string;
  label?: string;
  amount?: number;
  transactionDate?: Date;
}

interface DocumentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: AccountingDocument | null;
  onSave: (updatedDoc: {
    label?: string;
    amount?: number | null;
    transactionDate?: Date | null;
    newFile?: File | null;
  }) => Promise<void>;
  loading: boolean;
}

const DocumentEditDialog: React.FC<DocumentEditDialogProps> = ({
  open,
  onOpenChange,
  document,
  onSave,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setNewFile(acceptedFiles[0]);
      }
    },
    multiple: false,
  });
  
  // Reset form when dialog opens with new document
  useEffect(() => {
    if (open && document) {
      setLabel(document.label || "");
      setAmount(document.amount !== undefined ? document.amount.toString() : "");
      setDate(document.transactionDate);
      setNewFile(null);
      setActiveTab("details");
    }
  }, [open, document]);

  const handleSave = async () => {
    if (!document) return;
    
    const updates: {
      label?: string;
      amount?: number | null;
      transactionDate?: Date | null;
      newFile?: File | null;
    } = {};
    
    // Always include label (empty string if cleared)
    updates.label = label;
    
    // Always include amount (null if empty)
    if (amount && amount.trim() !== '') {
      updates.amount = parseFloat(amount);
    } else {
      updates.amount = null;
    }
    
    // Always include transaction date (null if not set)
    updates.transactionDate = date || null;
    
    // Include new file if selected
    if (newFile) {
      updates.newFile = newFile;
    }
    
    await onSave(updates);
  };

  // Render a disabled dialog if no document
  if (!document) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              No document selected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document details or upload a new version.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Document Details</TabsTrigger>
              <TabsTrigger value="replace">Replace File</TabsTrigger>
            </TabsList>
            
            {/* Document Details Tab */}
            <TabsContent value="details" className="space-y-4 py-4">
              {/* Document Label */}
              <div>
                <Label htmlFor="document-label" className="block mb-2 text-sm font-medium">Document Label</Label>
                <Input
                  id="document-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Enter document label"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used to name your document in the format: "{label || 'label'}.pdf"
                </p>
              </div>
              
              {/* Transaction Amount */}
              <div>
                <Label htmlFor="transaction-amount" className="block mb-2 text-sm font-medium">Transaction Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R</span>
                  <Input
                    id="transaction-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This is the amount associated with the transaction.  
                </p>
              </div>
              
              {/* Transaction Date */}
              <div >
                <Label htmlFor="transaction-date" className="block mb-2 text-sm font-medium">Transaction Date</Label>
                <div >
                  <div className="flex items-center space-x-2">
                  <Input 
                    id="transaction-date"
                    type="text"
                    readOnly
                    value={date ? format(date, "PPP") : "No date selected"}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCalendarOpen(!calendarOpen)}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                  This is the date associated with the transaction.
                </p>
                </div>
                
                {/* Calendar displayed directly in dialog */}
                {calendarOpen && (
                  <div className="border rounded p-2 bg-background mt-1 relative z-50">
                    <div className="flex justify-between mb-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setDate(undefined);
                          setCalendarOpen(false);
                        }}
                      >
                        Clear Date
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCalendarOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </div>
                )}
              </div>
              
              {/* Document Preview with Fullscreen Button */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>Current Document</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFullscreenOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>Full Screen</span>
                  </Button>
                </div>
                <div className="mt-2 border rounded overflow-hidden h-40">
                  <iframe
                    src={document.url}
                    className="w-full h-full"
                    title={`${document.fileName} Preview`}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Replace File Tab */}
            <TabsContent value="replace" className="space-y-4 py-4">
              <div>
                <Label>Upload New File</Label>
                <p className="text-sm text-muted-foreground mb-2 mt-1">
                  Upload a new file to replace the current document. The document details will be preserved.
                </p>
                
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed p-4 rounded flex items-center justify-center h-40 ${
                    isDragActive ? "bg-muted" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  {newFile ? (
                    <p className="text-sm">File selected: {newFile.name}</p>
                  ) : isDragActive ? (
                    <p className="text-sm">Drop the file here...</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Drag &amp; drop a file here, or click to select one.
                    </p>
                  )}
                </div>
              </div> 
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || (activeTab === "replace" && !newFile)}
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Fullscreen Document Viewer */}
      {document && (
        <FullscreenDocumentViewer
          open={fullscreenOpen}
          onOpenChange={setFullscreenOpen}
          documentUrl={document.url}
          documentName={document.label || document.fileName}
        />
      )}
    </>
  );
};

export default DocumentEditDialog;