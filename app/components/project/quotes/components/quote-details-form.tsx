import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuoteDetailsFormProps {
  quoteNumber: string;
  date: string;
  dueDate: string;
  updateField: (field: 'quoteNumber' | 'date' | 'dueDate', value: string) => void;
}

const QuoteDetailsForm: React.FC<QuoteDetailsFormProps> = ({
  quoteNumber,
  date,
  dueDate,
  updateField,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quoteNumber">Quote Number</Label>
          <Input
            id="quoteNumber"
            value={quoteNumber}
            onChange={(e) => updateField('quoteNumber', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="date">Quote Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => updateField('date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Valid Until</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => updateField('dueDate', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteDetailsForm;
