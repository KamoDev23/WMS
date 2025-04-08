import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  Trash, 
  MoveUp, 
  MoveDown, 
  FilePlus, 
  BookOpen, 
  Settings, 
  FileUp, 
  Download, 
} from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Types for our form
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

interface ClientDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  vatNumber: string;
}

interface VehicleDetails {
  registration: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
}

interface BankingDetails {
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  accountHolder: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteSettings {
  showLogo: boolean;
  showVehicleDetails: boolean;
  showBankingDetails: boolean;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  font: string;
}

interface QuoteData {
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

const calculateTotals = (items: LineItem[], vatRate: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  
  return { subtotal, vatAmount, total };
};

// Helper to generate a new quote number
const generateQuoteNumber = () => {
  const today = new Date();
  const dateStr = format(today, 'ddMMyy');
  
  // In a real app, you'd check your database for the latest number
  // For now, we'll use a random suffix for demonstration
  const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(3, '0');
  
  return `Q${dateStr}${randomSuffix}`;
};

interface QuoteCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  companyData?: CompanyDetails;
  vehicleData?: VehicleDetails;
  onSave: (quoteData: QuoteData, asDraft: boolean) => Promise<boolean | void>;
  onConvertToInvoice?: (quoteData: QuoteData) => Promise<boolean | void>;
  existingQuote?: QuoteData;
}

const QuoteCreator: React.FC<QuoteCreatorProps> = ({
  open,
  onOpenChange,
  projectId,
  companyData,
  vehicleData,
  onSave,
  onConvertToInvoice,
  existingQuote
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  
  // Initialize form state with default values or existing quote data
  const [quoteData, setQuoteData] = useState<QuoteData>(() => {
    if (existingQuote) {
      return { ...existingQuote };
    }
    
    // Default new quote
    return {
      id: '',
      quoteNumber: generateQuoteNumber(),
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'draft',
      company: companyData || {
        name: '',
        address: '',
        city: '',
        postalCode: '',
        email: '',
        phone: '',
        vatNumber: '',
      },
      client: {
        name: '',
        address: '',
        city: '',
        postalCode: '',
        email: '',
        phone: '',
        vatNumber: '',
      },
      vehicle: vehicleData || {
        registration: '',
        make: '',
        model: '',
        year: '',
        mileage: '',
        vin: '',
      },
      banking: {
        bankName: '',
        accountNumber: '',
        branchCode: '',
        accountType: '',
        accountHolder: '',
      },
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
        font: 'Inter',
      }
    };
  });

  // When line items change, recalculate totals
  useEffect(() => {
    const { subtotal, vatAmount, total } = calculateTotals(
      quoteData.lineItems, 
      quoteData.vatRate
    );
    
    setQuoteData(prev => ({
      ...prev,
      subtotal,
      vatAmount,
      total
    }));
  }, [quoteData.lineItems, quoteData.vatRate]);

  // Add a new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    
    setQuoteData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  // Update a line item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setQuoteData(prev => {
      const updatedItems = prev.lineItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total if quantity or unitPrice changed
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

  // Remove a line item
  const removeLineItem = (id: string) => {
    setQuoteData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  // Move a line item up or down
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

  // Update form fields
  const updateField = <T extends keyof QuoteData>(field: T, value: QuoteData[T]) => {
    setQuoteData(prev => ({ ...prev, [field]: value }));
  };

  // Update nested objects
  const updateNestedField = <T extends keyof QuoteData, U extends keyof QuoteData[T]>(
    object: T,
    field: U,
    value: any
  ) => {
    setQuoteData(prev => ({
      ...prev,
      [object]: {
        ...(prev[object] as object), // Add type assertion to fix the spread
        [field]: value
      }
    }));
  };

  // Handle form submission
  const handleSave = async (asDraft: boolean) => {
    setSaving(true);
    try {
      // If it's not a draft, validate required fields
      if (!asDraft) {
        // Add validation here
      }
      
      const finalQuoteData = {
        ...quoteData,
        status: (asDraft ? 'draft' : 'pending') as 'draft' | 'pending' // Add type assertion
      };
      
      await onSave(finalQuoteData, asDraft);
      
      // Close the dialog after saving
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle conversion to invoice
  const handleConvertToInvoice = async () => {
    if (!onConvertToInvoice) return;
    
    setConverting(true);
    try {
      await onConvertToInvoice({
        ...quoteData,
        status: 'invoice'
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error converting to invoice:', error);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle>
          {existingQuote ? 'Edit Quote' : 'Create New Quote'} - {quoteData.quoteNumber}
        </DialogTitle>
        <DialogDescription>
          Fill in the details to create a professional quote for your client.
        </DialogDescription>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="details">
              <BookOpen className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="items">
              <FilePlus className="h-4 w-4 mr-2" />
              Line Items
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="preview">
              <FileUp className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-1">
                {/* Quote Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quoteNumber">Quote Number</Label>
                        <Input
                          id="quoteNumber"
                          value={quoteData.quoteNumber}
                          onChange={(e) => updateField('quoteNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Quote Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={quoteData.date}
                          onChange={(e) => updateField('date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Valid Until</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={quoteData.dueDate}
                          onChange={(e) => updateField('dueDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Company Details */}
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
                          value={quoteData.company.name}
                          onChange={(e) => updateNestedField('company', 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyVatNumber">VAT Number</Label>
                        <Input
                          id="companyVatNumber"
                          value={quoteData.company.vatNumber}
                          onChange={(e) => updateNestedField('company', 'vatNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress">Address</Label>
                        <Textarea
                          id="companyAddress"
                          value={quoteData.company.address}
                          onChange={(e) => updateNestedField('company', 'address', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="companyCity">City</Label>
                            <Input
                              id="companyCity"
                              value={quoteData.company.city}
                              onChange={(e) => updateNestedField('company', 'city', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="companyPostalCode">Postal Code</Label>
                            <Input
                              id="companyPostalCode"
                              value={quoteData.company.postalCode}
                              onChange={(e) => updateNestedField('company', 'postalCode', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyEmail">Email</Label>
                          <Input
                            id="companyEmail"
                            type="email"
                            value={quoteData.company.email}
                            onChange={(e) => updateNestedField('company', 'email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyPhone">Phone</Label>
                          <Input
                            id="companyPhone"
                            value={quoteData.company.phone}
                            onChange={(e) => updateNestedField('company', 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Client Details */}
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
                          value={quoteData.client.name}
                          onChange={(e) => updateNestedField('client', 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientVatNumber">VAT Number</Label>
                        <Input
                          id="clientVatNumber"
                          value={quoteData.client.vatNumber}
                          onChange={(e) => updateNestedField('client', 'vatNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientAddress">Address</Label>
                        <Textarea
                          id="clientAddress"
                          value={quoteData.client.address}
                          onChange={(e) => updateNestedField('client', 'address', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="clientCity">City</Label>
                            <Input
                              id="clientCity"
                              value={quoteData.client.city}
                              onChange={(e) => updateNestedField('client', 'city', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="clientPostalCode">Postal Code</Label>
                            <Input
                              id="clientPostalCode"
                              value={quoteData.client.postalCode}
                              onChange={(e) => updateNestedField('client', 'postalCode', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail">Email</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={quoteData.client.email}
                            onChange={(e) => updateNestedField('client', 'email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientPhone">Phone</Label>
                          <Input
                            id="clientPhone"
                            value={quoteData.client.phone}
                            onChange={(e) => updateNestedField('client', 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Vehicle Details */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Vehicle Details</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={quoteData.settings.showVehicleDetails}
                        onCheckedChange={(checked) => 
                          updateNestedField('settings', 'showVehicleDetails', checked)
                        }
                      />
                      <Label>Show on Quote</Label>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleRegistration">Registration</Label>
                        <Input
                          id="vehicleRegistration"
                          value={quoteData.vehicle.registration}
                          onChange={(e) => updateNestedField('vehicle', 'registration', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleVin">VIN</Label>
                        <Input
                          id="vehicleVin"
                          value={quoteData.vehicle.vin}
                          onChange={(e) => updateNestedField('vehicle', 'vin', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleMake">Make</Label>
                        <Input
                          id="vehicleMake"
                          value={quoteData.vehicle.make}
                          onChange={(e) => updateNestedField('vehicle', 'make', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleModel">Model</Label>
                        <Input
                          id="vehicleModel"
                          value={quoteData.vehicle.model}
                          onChange={(e) => updateNestedField('vehicle', 'model', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleYear">Year</Label>
                        <Input
                          id="vehicleYear"
                          value={quoteData.vehicle.year}
                          onChange={(e) => updateNestedField('vehicle', 'year', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleMileage">Mileage</Label>
                        <Input
                          id="vehicleMileage"
                          value={quoteData.vehicle.mileage}
                          onChange={(e) => updateNestedField('vehicle', 'mileage', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Banking Details */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Banking Details</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={quoteData.settings.showBankingDetails}
                        onCheckedChange={(checked) => 
                          updateNestedField('settings', 'showBankingDetails', checked)
                        }
                      />
                      <Label>Show on Quote</Label>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={quoteData.banking.bankName}
                          onChange={(e) => updateNestedField('banking', 'bankName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder">Account Holder</Label>
                        <Input
                          id="accountHolder"
                          value={quoteData.banking.accountHolder}
                          onChange={(e) => updateNestedField('banking', 'accountHolder', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={quoteData.banking.accountNumber}
                          onChange={(e) => updateNestedField('banking', 'accountNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountType">Account Type</Label>
                        <Select 
                          value={quoteData.banking.accountType}
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
                          value={quoteData.banking.branchCode}
                          onChange={(e) => updateNestedField('banking', 'branchCode', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={quoteData.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="Add any additional notes, terms, or instructions for the client..."
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Line Items Tab */}
          <TabsContent value="items" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>
                      Add the products or services you're quoting for.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Line Items Table */}
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr className="divide-x">
                              <th className="px-4 py-2 text-left">Description</th>
                              <th className="px-4 py-2 text-center">Quantity</th>
                              <th className="px-4 py-2 text-center">Unit Price</th>
                              <th className="px-4 py-2 text-center">Total</th>
                              <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {quoteData.lineItems.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                  No items added yet. Click "Add Item" below to get started.
                                </td>
                              </tr>
                            ) : (
                              quoteData.lineItems.map((item, index) => (
                                <tr key={item.id} className="divide-x">
                                  <td className="px-4 py-2">
                                    <Input
                                      value={item.description}
                                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                      placeholder="Description"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="text-center"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unitPrice}
                                      onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                      className="text-center"
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-center font-medium">
                                    R {item.total.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center justify-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveLineItem(item.id, 'up')}
                                        disabled={index === 0}
                                      >
                                        <MoveUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveLineItem(item.id, 'down')}
                                        disabled={index === quoteData.lineItems.length - 1}
                                      >
                                        <MoveDown className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLineItem(item.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <Button onClick={addLineItem} className="mt-2" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50">
                    <div className="ml-auto w-1/3 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R {quoteData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span>VAT ({quoteData.vatRate}%):</span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={quoteData.vatRate}
                            onChange={(e) => updateField('vatRate', parseFloat(e.target.value) || 0)}
                            className="w-16 h-8"
                          />
                        </div>
                        <span>R {quoteData.vatAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>R {quoteData.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Appearance Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 p-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize how your quote looks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Logo Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showLogo">Show Company Logo</Label>
                          <Switch
                            id="showLogo"
                            checked={quoteData.settings.showLogo}
                            onCheckedChange={(checked) => 
                              updateNestedField('settings', 'showLogo', checked)
                            }
                          />
                        </div>
                        {quoteData.settings.showLogo && (
                          <div className="grid gap-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                              id="logoUrl"
                              value={quoteData.company.logoUrl || ''}
                              onChange={(e) => updateNestedField('company', 'logoUrl', e.target.value)}
                              placeholder="https://your-company.com/logo.png"
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter a URL to your company logo, or upload one to your hosting service.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Color Settings */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Colors</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="primaryColor">Primary Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="primaryColor"
                                type="color"
                                value={quoteData.settings.primaryColor}
                                onChange={(e) => 
                                  updateNestedField('settings', 'primaryColor', e.target.value)
                                }
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={quoteData.settings.primaryColor}
                                onChange={(e) => 
                                  updateNestedField('settings', 'primaryColor', e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="secondaryColor">Secondary Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="secondaryColor"
                                type="color"
                                value={quoteData.settings.secondaryColor}
                                onChange={(e) => 
                                  updateNestedField('settings', 'secondaryColor', e.target.value)
                                }
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={quoteData.settings.secondaryColor}
                                onChange={(e) => 
                                  updateNestedField('settings', 'secondaryColor', e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="textColor">Text Color</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="textColor"
                                type="color"
                                value={quoteData.settings.textColor}
                                onChange={(e) => 
                                  updateNestedField('settings', 'textColor', e.target.value)
                                }
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={quoteData.settings.textColor}
                                onChange={(e) => 
                                  updateNestedField('settings', 'textColor', e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Font Settings */}
                      <div className="space-y-2">
                        <Label htmlFor="font">Font</Label>
                        <Select 
                          value={quoteData.settings.font}
                          onValueChange={(value) => updateNestedField('settings', 'font', value)}
                        >
                          <SelectTrigger id="font">
                            <SelectValue placeholder="Select a font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                            <SelectItem value="Tahoma">Tahoma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <div className="p-4">
                <div
                  style={{
                    fontFamily: quoteData.settings.font,
                    color: quoteData.settings.textColor,
                  }}
                  className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto"
                >
                  {/* Quote Header */}
                  <div className="flex justify-between items-start" style={{ 
                    borderBottom: `2px solid ${quoteData.settings.primaryColor}`,
                    paddingBottom: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <div>
                      {quoteData.settings.showLogo && quoteData.company.logoUrl && (
                        <img 
                          src={quoteData.company.logoUrl} 
                          alt="Company Logo"
                          className="h-16 mb-2"
                        />
                      )}
                      <h1 className="text-2xl font-bold" style={{ color: quoteData.settings.primaryColor }}>
                        {quoteData.company.name}
                      </h1>
                      <p>{quoteData.company.address}</p>
                      <p>{quoteData.company.city}, {quoteData.company.postalCode}</p>
                      <p>Email: {quoteData.company.email}</p>
                      <p>Phone: {quoteData.company.phone}</p>
                      {quoteData.company.vatNumber && (
                        <p>VAT: {quoteData.company.vatNumber}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-bold mb-4" style={{ color: quoteData.settings.primaryColor }}>QUOTE</h2>
                      <p><strong>Quote #:</strong> {quoteData.quoteNumber}</p>
                      <p><strong>Date:</strong> {format(new Date(quoteData.date), 'dd MMM yyyy')}</p>
                      <p><strong>Valid Until:</strong> {format(new Date(quoteData.dueDate), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  
                  {/* Client and Vehicle Info */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Client Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: quoteData.settings.primaryColor }}>
                        Bill To:
                      </h3>
                      <p className="font-bold">{quoteData.client.name}</p>
                      <p>{quoteData.client.address}</p>
                      <p>{quoteData.client.city}, {quoteData.client.postalCode}</p>
                      <p>Email: {quoteData.client.email}</p>
                      <p>Phone: {quoteData.client.phone}</p>
                      {quoteData.client.vatNumber && (
                        <p>VAT: {quoteData.client.vatNumber}</p>
                      )}
                    </div>
                    
                    {/* Vehicle Info (if enabled) */}
                    {quoteData.settings.showVehicleDetails && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: quoteData.settings.primaryColor }}>
                          Vehicle Details:
                        </h3>
                        <p><strong>Registration:</strong> {quoteData.vehicle.registration}</p>
                        <p><strong>Make:</strong> {quoteData.vehicle.make}</p>
                        <p><strong>Model:</strong> {quoteData.vehicle.model}</p>
                        <p><strong>Year:</strong> {quoteData.vehicle.year}</p>
                        <p><strong>Mileage:</strong> {quoteData.vehicle.mileage}</p>
                        <p><strong>VIN:</strong> {quoteData.vehicle.vin}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Line Items */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: quoteData.settings.primaryColor }}>
                      Quote Details:
                    </h3>
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: quoteData.settings.secondaryColor }}>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-center">Quantity</th>
                          <th className="px-4 py-2 text-center">Unit Price</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quoteData.lineItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center">
                              No items added yet.
                            </td>
                          </tr>
                        ) : (
                          quoteData.lineItems.map((item, index) => (
                            <tr key={item.id} style={{ 
                              backgroundColor: index % 2 === 0 ? 'white' : quoteData.settings.secondaryColor + '20' 
                            }}>
                              <td className="px-4 py-2">{item.description}</td>
                              <td className="px-4 py-2 text-center">{item.quantity}</td>
                              <td className="px-4 py-2 text-center">R {item.unitPrice.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">R {item.total.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}></td>
                          <td className="px-4 py-2 text-right font-semibold">Subtotal:</td>
                          <td className="px-4 py-2 text-right">R {quoteData.subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={2}></td>
                          <td className="px-4 py-2 text-right font-semibold">VAT ({quoteData.vatRate}%):</td>
                          <td className="px-4 py-2 text-right">R {quoteData.vatAmount.toFixed(2)}</td>
                        </tr>
                        <tr style={{ 
                          borderTop: `2px solid ${quoteData.settings.primaryColor}`,
                          fontWeight: 'bold'
                        }}>
                          <td colSpan={2}></td>
                          <td className="px-4 py-2 text-right">Total:</td>
                          <td className="px-4 py-2 text-right">R {quoteData.total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  {/* Notes Section */}
                  {quoteData.notes && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: quoteData.settings.primaryColor }}>
                        Notes:
                      </h3>
                      <div className="p-4 border rounded" style={{ borderColor: quoteData.settings.secondaryColor }}>
                        {quoteData.notes.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Banking Details */}
                  {quoteData.settings.showBankingDetails && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: quoteData.settings.primaryColor }}>
                        Banking Details:
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <p><strong>Bank:</strong> {quoteData.banking.bankName}</p>
                        <p><strong>Account Holder:</strong> {quoteData.banking.accountHolder}</p>
                        <p><strong>Account Number:</strong> {quoteData.banking.accountNumber}</p>
                        <p><strong>Account Type:</strong> {quoteData.banking.accountType}</p>
                        <p><strong>Branch Code:</strong> {quoteData.banking.branchCode}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="text-center mt-12 pt-4" style={{ 
                    borderTop: `1px solid ${quoteData.settings.secondaryColor}` 
                  }}>
                    <p>Thank you for your business!</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="border-t pt-4 flex justify-between">
          <div className="flex space-x-2">
            {existingQuote && existingQuote.status !== 'invoice' && onConvertToInvoice && (
              <Button 
                onClick={handleConvertToInvoice}
                disabled={converting || quoteData.lineItems.length === 0}
                variant="secondary"
              >
                {converting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>Convert to Invoice</>
                )}
              </Button>
            )}
            <Button onClick={() => handleSave(true)} variant="outline" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save as Draft</>
              )}
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || converting}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSave(false)} 
              disabled={saving || quoteData.lineItems.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Save & Generate PDF
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteCreator;