import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface QuoteCreatorButtonProps {
  onClick: () => void;
}

const QuoteCreatorButton: React.FC<QuoteCreatorButtonProps> = ({ onClick }) => {
  return (
    <Button 
      onClick={onClick} 
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      Create Quote
    </Button>
  );
};

export default QuoteCreatorButton;