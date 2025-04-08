"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { QuoteDetails } from "@/lib/quote";

interface QuotePreviewProps {
  quote: QuoteDetails;
  company: {
    name: string;
    address: string;
    phone: string;
    vat: string;
  };
  banking: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branchCode: string;
  };
  formatCurrency: (amount: number) => string;
}

const QuotePreview: React.FC<QuotePreviewProps> = ({
  quote,
  company,
  banking,
  formatCurrency,
}) => {
  const statusStyles = {
    draft: { bg: "rgba(229, 231, 235, 0.7)", text: "#374151" },
    pending: { bg: "rgba(254, 243, 199, 0.7)", text: "#92400E" },
    approved: { bg: "rgba(209, 250, 229, 0.7)", text: "#065F46" },
    invoice: { bg: "rgba(219, 234, 254, 0.7)", text: "#1E40AF" },
  };

  const currentStatus = statusStyles[quote.status as keyof typeof statusStyles] ?? statusStyles.draft;

  return (
    <Card className="shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div
          className="bg-white border-gray-200 shadow-sm"
          style={{
            fontFamily: quote.settings.font,
            color: quote.settings.textColor,
            maxHeight: "calc(100vh - 230px)",
            overflowY: "auto",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('data:image/svg+xml;base64,PHN2Zy...')",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="h-2 w-full" style={{ backgroundColor: quote.settings.primaryColor }} />

          {/* Header */}
          <div className="p-8 pb-4 relative">
            {quote.status !== "invoice" && (
              <div className="absolute right-6 top-6 z-10">
                <div
                  className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
                  style={{
                    backgroundColor: currentStatus.bg,
                    color: currentStatus.text,
                    border: `1px solid ${currentStatus.text}25`,
                  }}
                >
                  {quote.status}
                </div>
              </div>
            )}

            {/* Company Info */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  {quote.settings.showLogo && (
                    <div className="h-16 w-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded border border-gray-200 shadow-sm" />
                  )}
                  <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: quote.settings.primaryColor }}>
                      {company.name}
                    </h1>
                    <p className="text-xs mt-0.5 text-gray-600">Merchant Code: {company.vat.split("-")[0]}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm space-y-0.5 text-gray-700">
                  <p>VAT: {company.vat}</p>
                  <p>Phone: {company.phone}</p>
                  <p>{company.address}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-right">
                <div
                  className="relative px-4 py-2 rounded"
                  style={{
                    backgroundColor: quote.settings.secondaryColor,
                    border: `1px solid ${quote.settings.primaryColor}25`,
                  }}
                >
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: quote.settings.primaryColor }}>
                    {quote.status === "invoice" ? "INVOICE" : "QUOTATION"}
                  </h2>
                  <span className="text-xs block mt-1" style={{ color: quote.settings.primaryColor + "99" }}>
                    Valid until: {format(new Date(quote.validUntil), "MM/dd/yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote & Client Info */}
          <div className="px-8">
            <Separator className="my-4" style={{ backgroundColor: quote.settings.primaryColor + "20" }} />
            <div className="grid grid-cols-2 gap-8 py-4">
              {/* Quote Details */}
              <div className="bg-gray-50 rounded p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 pb-2 border-b" style={{ color: quote.settings.primaryColor }}>
                  QUOTE DETAILS
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr><td className="py-1 font-medium">Quote No:</td><td>{quote.quoteNumber}</td></tr>
                    <tr><td className="py-1 font-medium">Date:</td><td>{format(new Date(quote.quoteDate), "MM/dd/yyyy")}</td></tr>
                    {quote.settings.showVehicleDetails && (
                      <>
                        <tr><td className="py-1 font-medium">Reg:</td><td>{quote.vehicleRegistration}</td></tr>
                        <tr><td className="py-1 font-medium">Make:</td><td>{quote.vehicleMake} {quote.vehicleModel}</td></tr>
                        {quote.vehicleMileage && <tr><td className="py-1 font-medium">Mileage:</td><td>{quote.vehicleMileage}</td></tr>}
                        {quote.vehicleVin && <tr><td className="py-1 font-medium">VIN:</td><td>{quote.vehicleVin}</td></tr>}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Client Details */}
              <div className="bg-gray-50 rounded p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 pb-2 border-b" style={{ color: quote.settings.primaryColor }}>
                  CLIENT DETAILS
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr><td className="py-1 font-medium">Contact Person:</td><td>{quote.clientName}</td></tr>
                    <tr><td className="py-1 font-medium">Address:</td><td>{quote.clientAddress}</td></tr>
                    {quote.clientEmail && <tr><td className="py-1 font-medium">Email:</td><td>{quote.clientEmail}</td></tr>}
                    {quote.clientPhone && <tr><td className="py-1 font-medium">Phone:</td><td>{quote.clientPhone}</td></tr>}
                    {quote.clientVatNumber && <tr><td className="py-1 font-medium">VAT:</td><td>{quote.clientVatNumber}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="px-8 py-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: quote.settings.primaryColor }}>PRODUCTS & SERVICES</h3>
            <div className="rounded overflow-hidden border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: quote.settings.primaryColor, color: 'white' }}>
                    <th className="py-2 px-3 text-left font-semibold">ITEM CODE</th>
                    <th className="py-2 px-3 text-left font-semibold">DESCRIPTION</th>
                    <th className="py-2 px-3 text-center font-semibold">QTY</th>
                    <th className="py-2 px-3 text-right font-semibold">UNIT PRICE</th>
                    <th className="py-2 px-3 text-right font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground">No items added</td>
                    </tr>
                  ) : (
                    quote.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3">{item.code}</td>
                        <td className="py-2 px-3">{item.description}</td>
                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">R {formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-medium">R {formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-2/3 border border-gray-200 shadow-sm rounded overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr><td className="py-2 px-3 font-semibold">SUB-TOTAL</td><td className="py-2 px-3 text-right">R {formatCurrency(quote.subtotal)}</td></tr>
                    <tr><td className="py-2 px-3 font-semibold">VAT (15%)</td><td className="py-2 px-3 text-right">R {formatCurrency(quote.tax)}</td></tr>
                    <tr style={{ backgroundColor: quote.settings.primaryColor, color: 'white' }}>
                      <td className="py-3 px-3 font-bold">TOTAL DUE</td>
                      <td className="py-3 px-3 text-right font-bold">R {formatCurrency(quote.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          {quote.settings.showBankingDetails && (
            <div className="px-8 pb-8">
              <div className="bg-gray-50 rounded-md p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold mb-3" style={{ color: quote.settings.primaryColor }}>BANKING DETAILS</h3>
                <table className="text-sm w-full">
                  <tbody>
                    <tr><td className="py-1 font-medium">Bank:</td><td>{banking.bankName}</td></tr>
                    <tr><td className="py-1 font-medium">Account Name:</td><td>{banking.accountHolder}</td></tr>
                    <tr><td className="py-1 font-medium">Account Number:</td><td>{banking.accountNumber}</td></tr>
                    <tr><td className="py-1 font-medium">Branch Code:</td><td>{banking.branchCode}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="px-8 pb-8">
              <div
                className="rounded-md p-4 text-sm whitespace-pre-line"
                style={{
                  backgroundColor: quote.settings.secondaryColor + "30",
                  border: `1px solid ${quote.settings.primaryColor}30`,
                }}
              >
                <h3 className="text-sm font-semibold mb-2" style={{ color: quote.settings.primaryColor }}>
                  NOTES
                </h3>
                {quote.notes}
              </div>
            </div>
          )}

          {/* Signatures */}
          {/* <div className="px-8 pb-8 mt-6 grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Authorized By:</p>
              <div className="border-b border-gray-300 pb-6"></div>
              <p className="text-xs text-gray-500 mt-1">{company.name} Representative</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Client Acceptance:</p>
              <div className="border-b border-gray-300 pb-6"></div>
              <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
            </div>
          </div> */}

          {/* Branding Footer */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 py-4 px-8 text-xs text-center text-gray-500 border-t">
            <p>Thank you for your business</p>
            <div className="flex items-center gap-3 mt-1 justify-center">
              <span className="h-px w-16 bg-gray-300"></span>
              <span className="text-xs font-medium tracking-wider" style={{ color: quote.settings.primaryColor }}>
                {company.name}
              </span>
              <span className="h-px w-16 bg-gray-300"></span>
            </div>
          </div>

          <div className="h-2 w-full" style={{ backgroundColor: quote.settings.primaryColor }} />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotePreview;
