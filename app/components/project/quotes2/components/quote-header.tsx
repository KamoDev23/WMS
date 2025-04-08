"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, Save, FileText, ChevronDown } from "lucide-react";
import { QuoteDetails } from "@/lib/quote";

interface QuoteHeaderProps {
  onStatusChange: (status: QuoteDetails["status"]) => void;
  onExportPDF?: () => void;
  onSaveDraft?: () => Promise<void>;
  onConvertToInvoice?: () => Promise<void>;
  isSaving?: boolean;
  isConverting?: boolean;
}

const QuoteHeader: React.FC<QuoteHeaderProps> = ({ 
  onStatusChange, 
  onExportPDF, 
  onSaveDraft,
  onConvertToInvoice,
  isSaving = false,
  isConverting = false
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Create Quote</h1>
      <div className="flex space-x-3">
        <Button 
        type="button"
          variant="outline" 
          onClick={onSaveDraft} 
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save as Draft"}
        </Button>
        
        <Button 
          type="button"
          variant="default" 
          onClick={onConvertToInvoice} 
          disabled={isConverting}
        >
          <FileText className="mr-2 h-4 w-4" />
          {isConverting ? "Converting..." : "Convert to Invoice"}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
            {/* Could add more export options here */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default QuoteHeader;