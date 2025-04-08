import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { QuoteData } from '../quote-creator-interface';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
 
interface QuotePreviewProps {
  quoteData: QuoteData;
  projectId: string;
  merchantId: string;
}

const QuotePreview: React.FC<QuotePreviewProps> = ({ quoteData, projectId, merchantId }) => {
  // Local state to hold fetched vehicle and banking details.
  const [vehicleDetails, setVehicleDetails] = useState(quoteData.vehicle);
  const [bankingDetails, setBankingDetails] = useState(quoteData.banking);

  // Format currency with thousands separators
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount).replace(/,/g, ' ');
  };

  // Get status badge color
  const getStatusColor = () => {
    switch(quoteData.status) {
      case 'draft': return { bg: 'rgba(229, 231, 235, 0.7)', text: '#374151' };
      case 'pending': return { bg: 'rgba(254, 243, 199, 0.7)', text: '#92400E' };
      case 'approved': return { bg: 'rgba(209, 250, 229, 0.7)', text: '#065F46' };
      case 'invoice': return { bg: 'rgba(219, 234, 254, 0.7)', text: '#1E40AF' };
      default: return { bg: 'rgba(229, 231, 235, 0.7)', text: '#374151' };
    }
  };
  const statusColor = getStatusColor();

  // Fetch vehicle details from the "projects" collection.
  useEffect(() => {
    async function fetchVehicleDetails() {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const data = projectSnap.data();
          setVehicleDetails({
            registration: data.registration || '',
            make: data.make || '',
            model: data.model || '',
            year: data.year || '',
            mileage: data.mileage || '',
            vin: data.vin || ''
          });
        }
      } catch (error) {
        console.error("Error fetching project vehicle details:", error);
      }
    }
    if (projectId) {
      fetchVehicleDetails();
    }
  }, [projectId]);

  // Fetch banking details from the "merchants" collection.
  useEffect(() => {
    async function fetchBankingDetails() {
      try {
        const merchantRef = doc(db, 'merchants', merchantId);
        const merchantSnap = await getDoc(merchantRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          setBankingDetails({
            bankName: data.banking?.bankName || '',
            accountNumber: data.banking?.accountNumber || '',
            branchCode: data.banking?.branchCode || '',
            accountType: data.banking?.accountType || '',
            accountHolder: data.banking?.accountHolder || ''
          });
        }
      } catch (error) {
        console.error("Error fetching merchant banking details:", error);
      }
    }
    if (merchantId) {
      fetchBankingDetails();
    }
  }, [merchantId]);

  return (
    <div
      className="bg-white rounded-sm border border-gray-200 shadow-sm"
      style={{
        fontFamily: quoteData.settings.font,
        color: quoteData.settings.textColor,
        maxWidth: "210mm", // A4 width
        margin: "auto",
      }}
    >
      {/* Header Section */}
      <div className="p-8 pb-6 relative">
        {quoteData.status !== 'invoice' && (
          <div 
            className="absolute right-8 top-8 px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider"
            style={{ 
              backgroundColor: statusColor.bg,
              color: statusColor.text
            }}
          >
            {quoteData.status}
          </div>
        )}
        
        <div className="flex justify-between items-start">
          {/* Company Logo and Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              {quoteData.settings.showLogo && quoteData.company.logoUrl && (
                <img 
                  src={quoteData.company.logoUrl} 
                  alt={`${quoteData.company.name} Logo`} 
                  className="h-16 w-auto object-contain" 
                  style={{ maxWidth: "120px" }}
                />
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: quoteData.settings.primaryColor }}>
                  {quoteData.company.name}
                </h1>
                <p className="text-xs mt-0.5 text-gray-600">
                  Merchant Code: {quoteData.company.vatNumber.split('-')[0]}
                </p>
              </div>
            </div>
            <div className="mt-4 text-sm space-y-0.5">
              {quoteData.company.vatNumber && <p>VAT: {quoteData.company.vatNumber}</p>}
              {quoteData.company.phone && <p>P: {quoteData.company.phone}</p>}
              <p>Address: {quoteData.company.address}, {quoteData.company.city}, {quoteData.company.postalCode}</p>
            </div>
          </div>
          
          {/* Quote Title */}
          <div className="text-right">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: quoteData.settings.primaryColor }}>
              {quoteData.status === 'invoice' ? 'INVOICE' : 'QUOTATION'}
            </h2>
          </div>
        </div>
      </div>
      
      {/* Quote and Client Details */}
      <div className="px-8">
        <div className="grid grid-cols-2 gap-6 border-t border-b py-4" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          {/* Quote Details */}
          <div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-medium">Quote No:</td>
                  <td>{quoteData.quoteNumber}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Date:</td>
                  <td>{format(new Date(quoteData.date), 'M/d/yyyy')}</td>
                </tr>
                {quoteData.settings.showVehicleDetails && (
                  <>
                    <tr>
                      <td className="py-1 font-medium">Registration No:</td>
                      <td>{vehicleDetails.registration}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Vehicle Make:</td>
                      <td>{vehicleDetails.make} {vehicleDetails.model}</td>
                    </tr>
                    {vehicleDetails.mileage && (
                      <tr>
                        <td className="py-1 font-medium">Mileage:</td>
                        <td>{vehicleDetails.mileage}</td>
                      </tr>
                    )}
                    {vehicleDetails.vin && (
                      <tr>
                        <td className="py-1 font-medium">VIN:</td>
                        <td>{vehicleDetails.vin}</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Client Details */}
          <div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-medium">Contact Person:</td>
                  <td>{quoteData.client.name}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium" style={{ verticalAlign: "top" }}>Address:</td>
                  <td>
                    <div>{quoteData.client.address}</div>
                    {quoteData.client.city && (
                      <div>{quoteData.client.city} {quoteData.client.postalCode}</div>
                    )}
                  </td>
                </tr>
                {quoteData.client.email && (
                  <tr>
                    <td className="py-1 font-medium">Email:</td>
                    <td>{quoteData.client.email}</td>
                  </tr>
                )}
                {quoteData.client.phone && (
                  <tr>
                    <td className="py-1 font-medium">Phone:</td>
                    <td>{quoteData.client.phone}</td>
                  </tr>
                )}
                {quoteData.client.vatNumber && (
                  <tr>
                    <td className="py-1 font-medium">VAT:</td>
                    <td>{quoteData.client.vatNumber}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Line Items Table */}
      <div className="px-8 py-6">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ 
              backgroundColor: quoteData.settings.secondaryColor,
              color: quoteData.settings.textColor
            }}>
              <th className="py-2 px-3 text-left font-semibold border-y" style={{ width: "15%" }}>ITEM CODE</th>
              <th className="py-2 px-3 text-left font-semibold border-y" style={{ width: "45%" }}>DESCRIPTION</th>
              <th className="py-2 px-3 text-center font-semibold border-y" style={{ width: "10%" }}>QTY</th>
              <th className="py-2 px-3 text-right font-semibold border-y" style={{ width: "15%" }}>UNIT PRICE</th>
              <th className="py-2 px-3 text-right font-semibold border-y" style={{ width: "15%" }}>TOTAL PRICE</th>
            </tr>
          </thead>
          <tbody>
            {quoteData.lineItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500">
                  No items added yet. Click "Add Item" to get started.
                </td>
              </tr>
            ) : (
              quoteData.lineItems.map((item, index) => (
                <tr key={item.id} style={{ 
                  backgroundColor: index % 2 === 1 ? 'rgba(0,0,0,0.02)' : 'transparent'
                }}>
                  <td className="py-2 px-3 text-left align-top border-b">
                    {item.code || '-'}
                  </td>
                  <td className="py-2 px-3 text-left align-top border-b">
                    {item.description}
                  </td>
                  <td className="py-2 px-3 text-center align-top border-b">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-3 text-right align-top border-b">
                    R {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2 px-3 text-right align-top border-b">
                    R {formatCurrency(item.total)}
                  </td>
                </tr>
              ))
            )}
            
            {/* Ensure at least 5 rows */}
            {quoteData.lineItems.length < 5 && Array(5 - quoteData.lineItems.length).fill(0).map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: "37px" }}>
                <td className="border-b">&nbsp;</td>
                <td className="border-b"></td>
                <td className="border-b"></td>
                <td className="border-b"></td>
                <td className="border-b"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="pt-2">
                <div className="flex justify-end">
                  <table className="text-sm w-1/3">
                    <tbody>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                        <td className="py-2 px-3 font-semibold">SUB-TOTAL EX</td>
                        <td className="py-2 px-3 text-right">R {formatCurrency(quoteData.subtotal)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold">VAT</td>
                        <td className="py-2 px-3 text-right">R {formatCurrency(quoteData.vatAmount)}</td>
                      </tr>
                      <tr style={{ backgroundColor: quoteData.settings.primaryColor, color: 'white' }}>
                        <td className="py-2 px-3 font-bold">TOTAL DUE</td>
                        <td className="py-2 px-3 text-right font-bold">R {formatCurrency(quoteData.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Banking Details */}
      {quoteData.settings.showBankingDetails && (
        <div className="px-8 pb-6">
          <div className="border-t pt-4" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: quoteData.settings.primaryColor }}>
              Banking Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 font-medium">Bank:</td>
                      <td>{bankingDetails.bankName}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Account Name:</td>
                      <td>{bankingDetails.accountHolder}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 font-medium">Account Number:</td>
                      <td>{bankingDetails.accountNumber}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Branch Code:</td>
                      <td>{bankingDetails.branchCode}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notes Section */}
      {quoteData.notes && (
        <div className="px-8 pb-8">
          <div className="border-t pt-4" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: quoteData.settings.primaryColor }}>
              Notes
            </h3>
            <div className="text-sm whitespace-pre-line p-3 bg-gray-50 rounded">
              {quoteData.notes}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="px-8 py-4 text-xs text-center text-gray-500 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        Thank you for your business
      </div>
    </div>
  );
};

export default QuotePreview;
