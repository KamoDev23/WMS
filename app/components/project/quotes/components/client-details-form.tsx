import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  vatNumber: string;
}

interface ClientDetailsFormProps {
  client: ClientDetails;
  updateNestedField: (object: 'client', field: keyof ClientDetails, value: any) => void;
}

const ClientDetailsForm: React.FC<ClientDetailsFormProps> = ({ client, updateNestedField }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={client.name}
              onChange={(e) => updateNestedField('client', 'name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientVatNumber">VAT Number</Label>
            <Input
              id="clientVatNumber"
              value={client.vatNumber}
              onChange={(e) => updateNestedField('client', 'vatNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientAddress">Address</Label>
            <Textarea
              id="clientAddress"
              value={client.address}
              onChange={(e) => updateNestedField('client', 'address', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="clientCity">City</Label>
              <Input
                id="clientCity"
                value={client.city}
                onChange={(e) => updateNestedField('client', 'city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPostalCode">Postal Code</Label>
              <Input
                id="clientPostalCode"
                value={client.postalCode}
                onChange={(e) => updateNestedField('client', 'postalCode', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={client.email}
              onChange={(e) => updateNestedField('client', 'email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Phone</Label>
            <Input
              id="clientPhone"
              value={client.phone}
              onChange={(e) => updateNestedField('client', 'phone', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientDetailsForm;
