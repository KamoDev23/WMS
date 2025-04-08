"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getAuth } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { QuoteDetails } from "@/lib/quote";
import { Client } from "../../business/settings/client-dialog";
import { LineItem } from "../quotes/quote-creator-interface";
import ClientSelector from "./components/client-selector";
import LineItemsTable from "./components/line-items-table";
import QuoteForm from "./components/quote-form";
import QuoteHeader from "./components/quote-header";
import QuotePreview from "./components/quote-preview";
import TotalsSection from "./components/totals-section";
import { useCustomToast } from "../../customs/toast"; 
import { useRouter } from "next/navigation"; 
import { convertQuoteToInvoice, saveQuoteAsDraft } from "@/lib/quote-repository";
import { exportQuoteToPDF } from "@/lib/quote-exoport-service";
import LoadingState, { LoadingOverlay } from "../../customs/loading-state";
import ConfirmationDialog from "../../customs/confirmation-dialog";

export default function QuoteCreatorPage() {
  const toast = useCustomToast();
  const router = useRouter();
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [company, setCompany] = useState({
    name: "",
    address: "",
    phone: "",
    vat: "",
    logo: ""
  });
  const [banking, setBanking] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    branchCode: ""
  });

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yy = String(today.getFullYear()).slice(-2);
  const initialQuoteNumber = `Q${dd}${mm}${yy}001`;

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [quote, setQuote] = useState<QuoteDetails>({
    quoteNumber: initialQuoteNumber,
    quoteDate: today.toISOString().split("T")[0],
    validUntil: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    clientName: "",
    clientAddress: "",
    clientCity: "",
    clientPostalCode: "",
    clientEmail: "",
    clientPhone: "",
    clientVatNumber: "",
    vehicleDetails: "GPC 511 FS",
    vehicleRegistration: "GPC 511 FS",
    vehicleMake: "",
    vehicleModel: "",
    vehicleMileage: "",
    vehicleVin: "",
    lineItems: [],
    notes: "",
    subtotal: 0,
    tax: 0,
    total: 0,
    status: "draft",
    settings: {
      font: "Arial",
      primaryColor: "#1E40AF",
      secondaryColor: "#EEF2FF",
      textColor: "#000000",
      showLogo: true,
      showVehicleDetails: true,
      showBankingDetails: true
    }
  });

  // Fetch clients and company data from merchant data
  useEffect(() => {
    const fetchMerchantData = async () => {
      setIsLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setIsLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const merchantCode = userData?.merchantCode;

        if (!merchantCode) {
          setIsLoading(false);
          return;
        }

        const merchantDoc = await getDoc(doc(db, "merchants", merchantCode));
        if (merchantDoc.exists()) {
          const data = merchantDoc.data();
          setClients(data.clients || []);
          
          // Get company info
          if (data.companyInfo) {
            setCompany({
              name: data.companyInfo.name || "",
              address: data.companyInfo.address || "",
              phone: data.companyInfo.phone || "",
              vat: data.companyInfo.vat || "",
              logo: data.companyInfo.logo || ""
            });
          }
          
          // Get banking info
          if (data.bankingInfo) {
            setBanking({
              bankName: data.bankingInfo.bankName || "",
              accountNumber: data.bankingInfo.accountNumber || "",
              accountHolder: data.bankingInfo.accountHolder || "",
              branchCode: data.bankingInfo.branchCode || ""
            });
          }

          // Get quote number
          if (data.quoteSettings?.lastQuoteNumber) {
            // Increment the last quote number
            const lastNumber = parseInt(data.quoteSettings.lastQuoteNumber.slice(-3));
            const newNumber = `Q${dd}${mm}${yy}${String(lastNumber + 1).padStart(3, "0")}`;
            setQuote(prev => ({ ...prev, quoteNumber: newNumber }));
          }
        }
      } catch (error) {
        console.error("Error fetching merchant data:", error);
        toast({
          message: "Error Loading Data",
          description: "Failed to load your business data. Please try again.",
           
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantData();
  }, [dd, mm, yy, toast]);

  // Handle client selection
  useEffect(() => {
    if (!selectedClientId) return;
    const selected = clients.find((c) => c.id === selectedClientId);
    if (selected) {
      setQuote((prev) => ({
        ...prev,
        clientName: selected.contactPerson,
        clientAddress: selected.address, 
        clientVatNumber: selected.vat || "",
      }));
    }
  }, [selectedClientId, clients]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace(/,/g, " ");
  };

  // Line item logic
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      code: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    updateLineItems([...quote.lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    const updatedItems = quote.lineItems.filter((item) => item.id !== id);
    updateLineItems(updatedItems);
  };

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string) => {
    const updatedItems = quote.lineItems.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item };
        if (field === "code" || field === "description") {
          updatedItem[field] = value;
        } else {
          (updatedItem as any)[field] = parseFloat(value) || 0;
        }

        if (field === "quantity" || field === "unitPrice") {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }

        return updatedItem;
      }
      return item;
    });
    updateLineItems(updatedItems);
  };

  const updateLineItems = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;
    setQuote((prev) => ({
      ...prev,
      lineItems: items,
      subtotal,
      tax,
      total
    }));
  };

  const handleStatusChange = (status: QuoteDetails["status"]) => {
    setQuote((prev) => ({ ...prev, status }));
  };

  // Validation function
  const validateQuote = (): boolean => {
    if (!quote.clientName || !quote.clientAddress) {
      toast({
        message: "Missing Client Information",
        description: "Please enter client name and address.",
        duration: 5000
      });
      return false;
    }
    
    if (quote.lineItems.length === 0) {
      toast({
        message: "No Line Items",
        description: "Please add at least one line item to the quote.",
        duration: 5000
      });
      return false;
    }
    
    // Check if line items have descriptions and prices
    const invalidItems = quote.lineItems.filter(
      item => !item.description || item.unitPrice <= 0
    );
    
    if (invalidItems.length > 0) {
      toast({
        message: "Incomplete Line Items",
        description: "Please ensure all line items have descriptions and prices.",
        duration: 5000
      });
      return false;
    }
    
    return true;
  };

  // Handle saving as draft
  const handleSaveDraft = async () => {
    if (!validateQuote()) return;
    
    setIsSaving(true);
    
    try {
      const result = await saveQuoteAsDraft(quote);
      
      if (result.success) {
        toast({
          message: "Quote Saved",
          description: `Quote #${quote.quoteNumber} has been saved as a draft.`,
          duration: 5000
        });
        
        // Update the quote with the ID
        if (result.id) {
          setQuote(prev => ({ ...prev, id: result.id }));
        }
      } else {
        toast({
          message: "Save Failed",
          description: result.error || "An error occurred while saving the quote.",
          duration: 5000
        });
      }
    } catch (error) {
      toast({
        message: "Save Failed",
        description: "An unexpected error occurred.",
        duration: 5000
      });
      console.error("Error saving quote:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle converting to invoice
  const handleConvertToInvoice = async () => {
    if (!validateQuote()) return;
    
    // If quote hasn't been saved yet, save it first
    if (!quote.id) {
      toast({
        message: "Save Required",
        description: "Please save the quote as a draft first.",
        duration: 5000
      });
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  // Actual conversion after confirmation
  const confirmConversion = async () => {
    setIsConverting(true);
    setShowConfirmation(false);
    
    try {
      const result = await convertQuoteToInvoice(quote.id!);
      
      if (result.success) {
        toast({
          message: "Quote Converted",
          description: "The quote has been successfully converted to an invoice.",
          duration: 5000
        });
        
        // Redirect to the invoice page
        if (result.id) {
          router.push(`/invoices/${result.id}`);
        }
      } else {
        toast({
          message: "Conversion Failed",
          description: result.error || "An error occurred while converting to invoice.",
          duration: 5000
        });
      }
    } catch (error) {
      toast({
        message: "Conversion Failed",
        description: "An unexpected error occurred.",
        duration: 5000
      });
      console.error("Error converting quote:", error);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle exporting to PDF
  const handleExportPDF = () => {
    if (!validateQuote()) return;
    
    try {
      exportQuoteToPDF({
        quote,
        company,
        banking,
        formatCurrency
      });
      
      toast({
        message: "PDF Exported",
        description: "Your quote has been exported as a PDF.",
        duration: 3000
      });
    } catch (error) {
      toast({
        message: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        duration: 5000
      });
      console.error("Error exporting PDF:", error);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveDraft();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingState 
          isLoading={true} 
          size="lg" 
          text="Loading quote data..."
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 relative">
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmConversion}
        title="Convert to Invoice"
        description="Are you sure you want to convert this quote to an invoice? This action cannot be undone."
        confirmText="Convert"
        cancelText="Cancel"
        isProcessing={isConverting}
      />
      
      <QuoteHeader 
        onStatusChange={handleStatusChange} 
        onExportPDF={handleExportPDF}
        onSaveDraft={handleSaveDraft}
        onConvertToInvoice={handleConvertToInvoice}
        isSaving={isSaving}
        isConverting={isConverting}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 relative">
          {(isSaving || isConverting) && (
            <LoadingOverlay 
              show={true}
              text={isSaving ? "Saving quote..." : "Converting to invoice..."}
              size="md" isLoading={true}            />
          )}
          <QuotePreview 
            quote={quote} 
            formatCurrency={formatCurrency} 
            company={company}
            banking={banking}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <QuoteForm quote={quote} setQuote={setQuote} />
          <ClientSelector
            clients={clients}
            selectedClientId={selectedClientId}
            setSelectedClientId={setSelectedClientId}
            quote={quote}
          />
          <LineItemsTable
            lineItems={quote.lineItems}
            onAdd={addLineItem}
            onRemove={removeLineItem}
            onChange={handleLineItemChange}
            formatCurrency={formatCurrency}
            settings={quote.settings}
          />
          <TotalsSection quote={quote} formatCurrency={formatCurrency} />

          <div className="pt-4 flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving || isConverting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || isConverting}
            >
              {isSaving ? "Saving..." : "Save Quote"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}