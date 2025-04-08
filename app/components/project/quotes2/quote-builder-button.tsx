import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle } from 'lucide-react';

interface QuoteBuilderButtonProps {
  onOpenQuoteBuilder: () => void;
}

const QuoteBuilderButton: React.FC<QuoteBuilderButtonProps> = ({ 
  onOpenQuoteBuilder 
}) => {
  return (
    <Button 
      onClick={onOpenQuoteBuilder}
      className="flex items-center gap-2"
    >
      <PlusCircle className="h-4 w-4" />
      <span>Create Quote</span>
    </Button>
  );
};

export default QuoteBuilderButton;