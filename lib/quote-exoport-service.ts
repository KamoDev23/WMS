// lib/services/quote-export-service.ts
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { QuoteDetails } from "@/lib/quote";
import { LineItem } from "@/app/components/project/quotes/quote-creator-interface";
 
// Need to extend the jsPDF type to include autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Company {
  name: string;
  address: string;
  phone: string;
  vat: string;
  logo?: string;
}

interface Banking {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string;
}

interface ExportQuoteOptions {
  quote: QuoteDetails;
  company: Company;
  banking: Banking;
  formatCurrency: (amount: number) => string;
}

export const exportQuoteToPDF = ({
  quote,
  company,
  banking,
  formatCurrency,
}: ExportQuoteOptions): void => {
  const doc = new jsPDF();
  
  // Set document properties
  const primaryColor = quote.settings.primaryColor || "#1E40AF";
  doc.setProperties({
    title: `Quote ${quote.quoteNumber}`,
    subject: `Quote for ${quote.clientName}`,
    creator: company.name,
  });
  
  // Add logo if enabled
  if (quote.settings.showLogo && company.logo) {
    try {
      doc.addImage(company.logo, "PNG", 15, 15, 50, 25);
    } catch (error) {
      console.error("Failed to add logo to PDF", error);
    }
  }

  // Font styles
  doc.setFont(quote.settings.font || "helvetica");
  doc.setTextColor(quote.settings.textColor || "#000000");
  
  // Company details
  doc.setFontSize(20);
  doc.text(company.name, 15, 30);
  
  doc.setFontSize(10);
  const companyDetails = [
    company.address,
    `Phone: ${company.phone}`,
    `VAT: ${company.vat}`,
  ];
  doc.text(companyDetails, 15, 40);
  
  // Quote title and number
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text(`QUOTE #${quote.quoteNumber}`, 140, 30);
  doc.setTextColor(quote.settings.textColor || "#000000");
  
  // Date information
  doc.setFontSize(10);
  const dateInfo = [
    `Date: ${new Date(quote.quoteDate).toLocaleDateString()}`,
    `Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`,
  ];
  doc.text(dateInfo, 140, 40);
  
  // Client details
  doc.setFontSize(12);
  doc.text("Bill To:", 15, 70);
  
  doc.setFontSize(10);
  const clientDetails = [
    quote.clientName,
    quote.clientAddress,
    quote.clientCity && quote.clientPostalCode 
      ? `${quote.clientCity}, ${quote.clientPostalCode}`
      : quote.clientCity || quote.clientPostalCode || "",
    quote.clientEmail ? `Email: ${quote.clientEmail}` : "",
    quote.clientPhone ? `Phone: ${quote.clientPhone}` : "",
    quote.clientVatNumber ? `VAT: ${quote.clientVatNumber}` : "",
  ].filter(line => line !== "");
  
  doc.text(clientDetails, 15, 80);
  
  // Vehicle details if enabled
  let yPosition = 110;
  if (quote.settings.showVehicleDetails) {
    doc.setFontSize(12);
    doc.text("Vehicle Details:", 15, yPosition);
    
    doc.setFontSize(10);
    const vehicleDetails = [
      quote.vehicleRegistration ? `Registration: ${quote.vehicleRegistration}` : "",
      quote.vehicleMake && quote.vehicleModel 
        ? `Make/Model: ${quote.vehicleMake} ${quote.vehicleModel}`
        : "",
      quote.vehicleMileage ? `Mileage: ${quote.vehicleMileage}` : "",
      quote.vehicleVin ? `VIN: ${quote.vehicleVin}` : "",
    ].filter(line => line !== "");
    
    doc.text(vehicleDetails, 15, yPosition + 10);
    yPosition += 10 + (vehicleDetails.length * 5);
  }
  
  // Line items table
  yPosition += 10;
  const tableColumns = [
    { header: "Code", dataKey: "code" },
    { header: "Description", dataKey: "description" },
    { header: "Qty", dataKey: "quantity" },
    { header: "Unit Price", dataKey: "unitPrice" },
    { header: "Total", dataKey: "total" },
  ];
  
  const tableRows = quote.lineItems.map((item: LineItem) => ({
    code: item.code,
    description: item.description,
    quantity: item.quantity,
    unitPrice: formatCurrency(item.unitPrice),
    total: formatCurrency(item.total),
  }));
  
  doc.autoTable({
    startY: yPosition,
    head: [tableColumns.map(col => col.header)],
    body: tableRows.map(row => 
      tableColumns.map(col => row[col.dataKey as keyof typeof row])
    ),
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: "#FFFFFF",
      fontStyle: "bold",
    },
    styles: {
      font: quote.settings.font || "helvetica",
      textColor: quote.settings.textColor || "#000000",
    },
    columnStyles: {
      0: { cellWidth: 30 },  // Code
      1: { cellWidth: 70 },  // Description
      2: { cellWidth: 20 },  // Qty
      3: { cellWidth: 30 },  // Unit Price
      4: { cellWidth: 30 },  // Total
    },
  });
  
  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals section
  doc.setFontSize(10);
  doc.text("Subtotal:", 130, finalY);
  doc.text(formatCurrency(quote.subtotal), 170, finalY, { align: "right" });
  
  doc.text("Tax (15%):", 130, finalY + 7);
  doc.text(formatCurrency(quote.tax), 170, finalY + 7, { align: "right" });
  
  doc.setFontSize(12);
  doc.setFont(quote.settings.font || "helvetica", "bold");
  doc.text("Total:", 130, finalY + 15);
  doc.text(formatCurrency(quote.total), 170, finalY + 15, { align: "right" });
  doc.setFont(quote.settings.font || "helvetica", "normal");
  
  // Banking details if enabled
  if (quote.settings.showBankingDetails) {
    doc.setFontSize(12);
    doc.text("Banking Details:", 15, finalY + 30);
    
    doc.setFontSize(10);
    const bankingDetails = [
      `Bank: ${banking.bankName}`,
      `Account Holder: ${banking.accountHolder}`,
      `Account Number: ${banking.accountNumber}`,
      `Branch Code: ${banking.branchCode}`,
    ];
    
    doc.text(bankingDetails, 15, finalY + 40);
  }
  
  // Notes section
  if (quote.notes) {
    doc.setFontSize(12);
    doc.text("Notes:", 15, finalY + 65);
    
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(quote.notes, 180);
    doc.text(splitNotes, 15, finalY + 75);
  }
  
  // Save the PDF
  doc.save(`Quote_${quote.quoteNumber}.pdf`);
};