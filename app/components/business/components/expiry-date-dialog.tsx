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
import { Loader2, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface ExpiryDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  documentName: string;
  onSave: (date: Date) => Promise<void>;
  isLoading?: boolean;
}

const ExpiryDateDialog: React.FC<ExpiryDateDialogProps> = ({
  open,
  onOpenChange,
  documentUrl,
  documentName,
  onSave,
  isLoading = false,
}) => {
  const [date, setDate] = useState<Date | undefined>(
    // Set default date to one year from now
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSave = async () => {
    if (date) {
      await onSave(date);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Document Expiry Date</DialogTitle>
          <DialogDescription>
            Please review the document and set its expiry date.
          </DialogDescription>
        </DialogHeader>
        
        {/* Document Preview */}
        <div className="mb-4">
          <iframe
            src={documentUrl}
            className="w-full h-[500px] border rounded"
            title={`${documentName} Preview`}
          />
        </div>
        
        {/* Inline Calendar (instead of Popover) */}
        <div className="grid gap-4 py-4">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          
          {/* Show selected date */}
          <div className="flex items-center space-x-2">
            <Input 
              id="expiryDate"
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
            <div className="border rounded p-2 bg-background mt-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setCalendarOpen(false);
                }}
                // disabled={(date) => date < new Date()}
                initialFocus
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!date || isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            ) : (
              "Save Expiry Date"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpiryDateDialog;