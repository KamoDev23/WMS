"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

export interface Client {
  id: string;
  contactPerson: string;
  clientName: string;
  address: string;
  vat: string;
}

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (client: Client) => void;
    client: Client | null;
    isSaving: boolean;
  }
  

export const ClientDialog: React.FC<ClientDialogProps> = ({ open, onOpenChange, onSave, client, isSaving }) => {
  const [form, setForm] = useState<Client>({
    id: uuidv4(),
    contactPerson: "",
    clientName: "",
    address: "",
    vat: "",
  });

  useEffect(() => {
    if (client) {
      setForm(client);
    } else {
      setForm({
        id: uuidv4(),
        contactPerson: "",
        clientName: "",
        address: "",
        vat: "",
      });
    }
  }, [client]);

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Contact Person"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
          <Input
            placeholder="Client Name"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          />
          <Input
            placeholder="Client Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            placeholder="VAT"
            value={form.vat}
            onChange={(e) => setForm({ ...form, vat: e.target.value })}
          />
        </div>
        <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </span>
                ) : (
                "Save"
                )}
            </Button>
            </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
