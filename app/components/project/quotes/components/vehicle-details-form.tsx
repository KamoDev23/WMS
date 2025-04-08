import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VehicleDetails {
  registration: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
}

interface VehicleDetailsFormProps {
  vehicle: VehicleDetails;
  updateNestedField: (object: 'vehicle', field: keyof VehicleDetails, value: any) => void;
}

const VehicleDetailsForm: React.FC<VehicleDetailsFormProps> = ({ vehicle, updateNestedField }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleRegistration">Registration</Label>
            <Input
              id="vehicleRegistration"
              value={vehicle.registration}
              onChange={(e) => updateNestedField('vehicle', 'registration', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleMake">Make</Label>
            <Input
              id="vehicleMake"
              value={vehicle.make}
              onChange={(e) => updateNestedField('vehicle', 'make', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleModel">Model</Label>
            <Input
              id="vehicleModel"
              value={vehicle.model}
              onChange={(e) => updateNestedField('vehicle', 'model', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleYear">Year</Label>
            <Input
              id="vehicleYear"
              value={vehicle.year}
              onChange={(e) => updateNestedField('vehicle', 'year', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleMileage">Mileage</Label>
            <Input
              id="vehicleMileage"
              value={vehicle.mileage}
              onChange={(e) => updateNestedField('vehicle', 'mileage', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleVin">VIN</Label>
            <Input
              id="vehicleVin"
              value={vehicle.vin}
              onChange={(e) => updateNestedField('vehicle', 'vin', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleDetailsForm;
