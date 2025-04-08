import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BankingDetails {
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  accountHolder: string;
}

interface BankingDetailsFormProps {
  banking: BankingDetails;
  updateNestedField: (object: 'banking', field: keyof BankingDetails, value: any) => void;
}

const BankingDetailsForm: React.FC<BankingDetailsFormProps> = ({ banking, updateNestedField }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Banking Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={banking.bankName}
              onChange={(e) => updateNestedField('banking', 'bankName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountHolder">Account Holder</Label>
            <Input
              id="accountHolder"
              value={banking.accountHolder}
              onChange={(e) => updateNestedField('banking', 'accountHolder', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={banking.accountNumber}
              onChange={(e) => updateNestedField('banking', 'accountNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={banking.accountType}
              onValueChange={(value) => updateNestedField('banking', 'accountType', value)}
            >
              <SelectTrigger id="accountType">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchCode">Branch Code</Label>
            <Input
              id="branchCode"
              value={banking.branchCode}
              onChange={(e) => updateNestedField('banking', 'branchCode', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankingDetailsForm;
