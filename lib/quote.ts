// lib/quote.ts

import { LineItem } from "@/app/components/project/quotes/quote-creator-interface";

 
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted" | "invoice";

export interface QuoteSettings {
  font: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  showLogo: boolean;
  showVehicleDetails: boolean;
  showBankingDetails: boolean;
}

export interface QuoteDetails {
  id?: string;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  
  // Client details
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientPostalCode: string;
  clientEmail: string;
  clientPhone: string;
  clientVatNumber: string;
  
  // Vehicle details
  vehicleDetails: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleMileage: string;
  vehicleVin: string;
  
  // Quote content
  lineItems: LineItem[];
  notes: string;
  
  // Financial details
  subtotal: number;
  tax: number;
  total: number;
  
  // Status and metadata
  status: QuoteStatus;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  invoiceId?: string;
  
  // Appearance settings
  settings: QuoteSettings;
}

export interface QuotePreviewProps {
  quote: QuoteDetails;
  formatCurrency: (amount: number) => string;
  company: {
    name: string;
    address: string;
    phone: string;
    vat: string;
    logo?: string;
  };
  banking: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branchCode: string;
  };
}