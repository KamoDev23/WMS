import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import AppearanceSettingsForm from './components/appearance-settings-form';
import BankingDetailsForm from './components/banking-details-form';
import ClientDetailsForm from './components/client-details-form';
import LineItemsForm from './components/line-items-form';
import QuoteDetailsForm from './components/quote-details-form';
import QuotePreview from './components/quote-preview';
import VehicleDetailsForm from './components/vehicle-details-form';
import CompanyDetailsForm from './components/company-details-form';

// Import your modular form components 


// Define your types (simplified; use your full definitions as needed)
export interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  vatNumber: string;
  logoUrl?: string;
}
export interface ClientDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  vatNumber: string;
}
export interface VehicleDetails {
  registration: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
}
export interface BankingDetails {
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  accountHolder: string;
}
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  code: string;
}
export interface QuoteSettings {
  showLogo: boolean;
  showVehicleDetails: boolean;
  showBankingDetails: boolean;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  font: string;
  logoUrl?: string; // Added logoUrl to QuoteSettings
}
export interface QuoteData {
  id: string;
  quoteNumber: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'invoice';
  company: CompanyDetails;
  client: ClientDetails;
  vehicle: VehicleDetails;
  banking: BankingDetails;
  lineItems: LineItem[];
  notes: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  settings: QuoteSettings;
}

// Helpers
const calculateTotals = (items: LineItem[], vatRate: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
};

const generateQuoteNumber = () => {
  const today = new Date();
  const dateStr = format(today, 'ddMMyy');
  const randomSuffix = Math.floor(Math.random() * 100)
    .toString()
    .padStart(3, '0');
  return `Q${dateStr}${randomSuffix}`;
};

const QuoteCreatorPage: React.FC = () => {
  // Initialize the quote state with default values
  const [quoteData, setQuoteData] = useState<QuoteData>({
    id: '',
    quoteNumber: generateQuoteNumber(),
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'draft',
    company: { name: '', address: '', city: '', postalCode: '', email: '', phone: '', vatNumber: '' },
    client: { name: '', address: '', city: '', postalCode: '', email: '', phone: '', vatNumber: '' },
    vehicle: { registration: '', make: '', model: '', year: '', mileage: '', vin: '' },
    banking: { bankName: '', accountNumber: '', branchCode: '', accountType: '', accountHolder: '' },
    lineItems: [],
    notes: '',
    subtotal: 0,
    vatRate: 15,
    vatAmount: 0,
    total: 0,
    settings: {
      showLogo: true,
      showVehicleDetails: true,
      showBankingDetails: true,
      primaryColor: '#3b82f6',
      secondaryColor: '#f3f4f6',
      textColor: '#374151',
      font: 'Inter'
    }
  });
  const [saving, setSaving] = useState(false);

  // Update totals whenever line items or VAT rate changes
  useEffect(() => {
    const { subtotal, vatAmount, total } = calculateTotals(quoteData.lineItems, quoteData.vatRate);
    setQuoteData(prev => ({ ...prev, subtotal, vatAmount, total }));
  }, [quoteData.lineItems, quoteData.vatRate]);

  // Common update functions
  const updateField = <K extends keyof QuoteData>(field: K, value: QuoteData[K]) => {
    setQuoteData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = <O extends keyof QuoteData, F extends keyof QuoteData[O]>(
    object: O,
    field: F,
    value: any
  ) => {
    setQuoteData(prev => ({
      ...prev,
      [object]: { ...(prev[object] as object), [field]: value }
    }));
  };

  // Example functions for line items management
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      code: ''
    };
    setQuoteData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setQuoteData(prev => {
      const updatedItems = prev.lineItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, lineItems: updatedItems };
    });
  };
  const removeLineItem = (id: string) => {
    setQuoteData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };
  const moveLineItem = (id: string, direction: 'up' | 'down') => {
    setQuoteData(prev => {
      const items = [...prev.lineItems];
      const index = items.findIndex(item => item.id === id);
      if (direction === 'up' && index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
      } else if (direction === 'down' && index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
      }
      return { ...prev, lineItems: items };
    });
  };

  // Save handler (update with your own save logic)
  const handleSave = async (asDraft: boolean) => {
    setSaving(true);
    try {
      const finalData = {
        ...quoteData,
        status: asDraft ? 'draft' : 'pending'
      };
      console.log('Saving quote:', finalData);
      // Call your API or saving logic here
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left side: Forms */}
      <div className="md:w-1/2 p-4 overflow-auto space-y-4">
        <QuoteDetailsForm
          quoteNumber={quoteData.quoteNumber}
          date={quoteData.date}
          dueDate={quoteData.dueDate}
          updateField={updateField}
        />
        <CompanyDetailsForm
          company={quoteData.company}
          updateNestedField={updateNestedField}
        />
        <ClientDetailsForm
          client={quoteData.client}
          updateNestedField={updateNestedField}
        />
        <VehicleDetailsForm
          vehicle={quoteData.vehicle}
          updateNestedField={updateNestedField}
        />
        <BankingDetailsForm
          banking={quoteData.banking}
          updateNestedField={updateNestedField}
        />
        <LineItemsForm
          lineItems={quoteData.lineItems}
          addLineItem={addLineItem}
          updateLineItem={updateLineItem}
          removeLineItem={removeLineItem}
          moveLineItem={moveLineItem}
          vatRate={quoteData.vatRate}
          updateField={updateField}
          subtotal={quoteData.subtotal}
          vatAmount={quoteData.vatAmount}
          total={quoteData.total}
        />
        <AppearanceSettingsForm
          settings={quoteData.settings}
          updateNestedField={updateNestedField}
          updateCompanyLogo={(value: string) => updateNestedField('settings', 'logoUrl', value)}
        />
        <div className="flex justify-between mt-4">
          <Button onClick={() => handleSave(true)} disabled={saving}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving || quoteData.lineItems.length === 0}>
            Save & Generate PDF
          </Button>
        </div>
      </div>

      {/* Right side: Live Preview */}
      <div className="md:w-1/2 p-4 overflow-auto bg-gray-50">
        <QuotePreview quoteData={quoteData} projectId={''} merchantId={''} />
      </div>
    </div>
  );
};

export default QuoteCreatorPage;
