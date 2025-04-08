import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  vatNumber: string;
  logoUrl?: string;
}

interface CompanyDetailsFormProps {
  company: CompanyDetails;
  updateNestedField: (object: 'company', field: keyof CompanyDetails, value: any) => void;
}

const CompanyDetailsForm: React.FC<CompanyDetailsFormProps> = ({ company, updateNestedField }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Company Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={company.name}
              onChange={(e) => updateNestedField('company', 'name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyVatNumber">VAT Number</Label>
            <Input
              id="companyVatNumber"
              value={company.vatNumber}
              onChange={(e) => updateNestedField('company', 'vatNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              value={company.address}
              onChange={(e) => updateNestedField('company', 'address', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="companyCity">City</Label>
              <Input
                id="companyCity"
                value={company.city}
                onChange={(e) => updateNestedField('company', 'city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPostalCode">Postal Code</Label>
              <Input
                id="companyPostalCode"
                value={company.postalCode}
                onChange={(e) => updateNestedField('company', 'postalCode', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyEmail">Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={company.email}
              onChange={(e) => updateNestedField('company', 'email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Phone</Label>
            <Input
              id="companyPhone"
              value={company.phone}
              onChange={(e) => updateNestedField('company', 'phone', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDetailsForm;
