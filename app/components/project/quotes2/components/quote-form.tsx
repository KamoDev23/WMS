"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { QuoteDetails } from "@/lib/quote";

export interface QuoteFormProps {
  quote: QuoteDetails;
  setQuote: React.Dispatch<React.SetStateAction<QuoteDetails>>;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, setQuote }) => {
  const {
    quoteNumber,
    quoteDate,
    validUntil,
    status,
    settings
  } = quote;

  const onChange = (field: keyof QuoteDetails | keyof QuoteDetails["settings"], value: string | boolean) => {
    if (field in settings) {
      setQuote((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [field]: value,
        },
      }));
    } else {
      setQuote((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quote Details & Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quoteNumber">Quote Number</Label>
            <Input
              id="quoteNumber"
              value={quoteNumber}
              onChange={(e) => onChange("quoteNumber", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => onChange("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quoteDate">Quote Date</Label>
            <Input
              type="date"
              id="quoteDate"
              value={quoteDate}
              onChange={(e) => onChange("quoteDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              type="date"
              id="validUntil"
              value={validUntil}
              onChange={(e) => onChange("validUntil", e.target.value)}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                id="primaryColor"
                value={settings.primaryColor}
                onChange={(e) => onChange("primaryColor", e.target.value)}
                className="w-12 h-9 p-1"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => onChange("primaryColor", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                id="secondaryColor"
                value={settings.secondaryColor}
                onChange={(e) => onChange("secondaryColor", e.target.value)}
                className="w-12 h-9 p-1"
              />
              <Input
                value={settings.secondaryColor}
                onChange={(e) => onChange("secondaryColor", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="font">Font</Label>
            <Select
              value={settings.font}
              onValueChange={(value) => onChange("font", value)}
            >
              <SelectTrigger id="font">
                <SelectValue placeholder="Select Font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Calibri">Calibri</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLogo"
              checked={settings.showLogo}
              onChange={(e) => onChange("showLogo", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="showLogo">Show Logo</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showVehicleDetails"
              checked={settings.showVehicleDetails}
              onChange={(e) => onChange("showVehicleDetails", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="showVehicleDetails">Show Vehicle Details</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showBankingDetails"
              checked={settings.showBankingDetails}
              onChange={(e) => onChange("showBankingDetails", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="showBankingDetails">Show Banking Details</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteForm;
