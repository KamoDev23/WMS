"use client";
import React, { useState } from "react";
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
import { format, set } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import FullscreenDocumentViewer from "../components/fullscreen-document-viewer";
 
interface AccountingDocument {
  id: string;
  fileName: string;
  url: string;
  category: string;
  label?: string;
}

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: AccountingDocument | null;
  onSave: (date: Date, amount: number) => Promise<void>;
  loading: boolean;
}

const TransactionDetailsDialog = ({
  open,
  onOpenChange,
  document,
  onSave,
  loading,
}: TransactionDetailsDialogProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  if (!document) return null;

  const handleSave = async () => {
    if (!date || !amount) return;
    
    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        throw new Error("Invalid amount");
      }
      
      await onSave(date, amountValue);
    } catch (error) {
      console.error("Error saving transaction details:", error);
    } finally {
      setDate(undefined);
      setAmount("");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Transaction Details</DialogTitle>
            <DialogDescription>
              Please review the document and enter transaction details.
            </DialogDescription>
          </DialogHeader>
          
          {/* Document Preview with Fullscreen Button */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Document Preview</Label>
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
            <div className="border rounded overflow-hidden">
              <iframe
                src={document.url}
                className="w-full h-[400px]"
                title={`${document.fileName} Preview`}
              />
            </div>
          </div>
          
          {/* Transaction Details Form */}
          <div className="grid gap-4 py-4">
            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="transactionDate"
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
            
            {/* Transaction Amount */}
            <div>
              <Label htmlFor="transactionAmount"  className="block mb-2 text-sm font-medium">Transaction Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R</span>
                <Input
                  id="transactionAmount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!date || !amount || loading}>
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Details"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Fullscreen Document Viewer */}
      <FullscreenDocumentViewer
        open={fullscreenOpen}
        onOpenChange={setFullscreenOpen}
        documentUrl={document.url}
        documentName={document.label || document.fileName}
      />
    </>
  );
};

export default TransactionDetailsDialog;