"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FullscreenDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  documentName: string;
}

const FullscreenDocumentViewer = ({
  open,
  onOpenChange,
  documentUrl,
  documentName,
}: FullscreenDocumentViewerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]] max-h-[95vh] h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="truncate mr-4">{documentName}</DialogTitle>
            
          </DialogHeader>
          
          <div className="flex-grow h-full overflow-hidden">
            <iframe
              src={documentUrl}
              className="w-full h-full"
              title={`${documentName} Fullscreen View`}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenDocumentViewer;