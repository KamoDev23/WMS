"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Client } from "@/app/components/business/settings/client-dialog";
import { QuoteDetails } from "@/lib/quote";

export interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string | null;
  setSelectedClientId: React.Dispatch<React.SetStateAction<string | null>>;
  quote: QuoteDetails;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClientId,
  setSelectedClientId,
  quote,
}) => {
  const selectedClient = clients.find((client) => client.id === selectedClientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Client Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="clientSelector" className="text-sm font-medium">
            Select Client *
          </Label>
          <Select
            value={selectedClientId ?? ""}
            onValueChange={(value) => setSelectedClientId(value)}
          >
            <SelectTrigger id="clientSelector">
              <SelectValue placeholder="Choose a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.clientName} — {client.contactPerson}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClient && (
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <Label>Contact Person</Label>
              <p>{selectedClient.contactPerson}</p>
            </div>
            <div>
              <Label>VAT Number</Label>
              <p>{selectedClient.vat || "N/A"}</p>
            </div>
            <div>
              <Label>Address</Label>
              <p>{selectedClient.address}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{quote.clientEmail || "N/A"}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p>{quote.clientPhone || "N/A"}</p>
            </div>
            <div>
              <Label>Postal Code</Label>
              <p>{quote.clientPostalCode || "N/A"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientSelector;
