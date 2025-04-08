"use client";

import { QuoteDetails } from "@/lib/quote";
import React from "react";
 
interface TotalsSectionProps {
  quote: QuoteDetails;
  formatCurrency: (amount: number) => string;
}

const TotalsSection: React.FC<TotalsSectionProps> = ({ quote, formatCurrency }) => {
  return (
    <div className="flex justify-end mt-4">
      <div className="w-full md:w-2/3 rounded-md overflow-hidden border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            <tr style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
              <td className="py-2 px-3 font-semibold">SUB-TOTAL</td>
              <td className="py-2 px-3 text-right">R {formatCurrency(quote.subtotal)}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold">VAT (15%)</td>
              <td className="py-2 px-3 text-right">R {formatCurrency(quote.tax)}</td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="h-2"
                style={{
                  background: `linear-gradient(90deg, ${quote.settings.secondaryColor}, ${quote.settings.primaryColor})`,
                }}
              />
            </tr>
            <tr
              style={{
                backgroundColor: quote.settings.primaryColor,
                color: "white",
                backgroundImage: `linear-gradient(135deg, ${quote.settings.primaryColor}, ${quote.settings.primaryColor}dd)`,
              }}
            >
              <td className="py-3 px-3 font-bold">TOTAL DUE</td>
              <td className="py-3 px-3 text-right font-bold">R {formatCurrency(quote.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TotalsSection;
