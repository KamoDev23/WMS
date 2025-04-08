"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineItem } from "../../quotes/quote-creator-interface";
import { QuoteDetails } from "@/lib/quote";
 
export interface LineItemsTableProps {
    lineItems: LineItem[];
    onAdd: () => void;
    onRemove: (id: string) => void;
    onChange: (id: string, field: keyof LineItem, value: string) => void;
    formatCurrency: (amount: number) => string;
    settings: QuoteDetails["settings"];
  }
  
  const LineItemsTable: React.FC<LineItemsTableProps> = ({
    lineItems,
    onAdd,
    onRemove,
    onChange,
    formatCurrency,
    settings,
  }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Line Items</CardTitle>
        <Button type="button" onClick={onAdd} size="sm">Add Line Item</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {lineItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No items added yet. Click "Add Line Item" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: settings.secondaryColor }}>
                  <th className="px-3 py-2 text-left font-semibold" style={{ width: "15%" }}>Item Code</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{ width: "40%" }}>Description</th>
                  <th className="px-3 py-2 text-center font-semibold" style={{ width: "10%" }}>Qty</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ width: "15%" }}>Unit Price</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ width: "15%" }}>Total Price</th>
                  <th className="px-3 py-2 text-center font-semibold" style={{ width: "5%" }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item.id} style={{ backgroundColor: index % 2 === 1 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                    <td className="px-3 py-2 border-b">
                      <Input
                        placeholder="Code"
                        value={item.code}
                        onChange={(e) => onChange(item.id, "code", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => onChange(item.id, "description", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <Input
                        placeholder="Qty"
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(e) => onChange(item.id, "quantity", e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="px-3 py-2 border-b">
                      <Input
                        placeholder="Unit Price"
                        type="number"
                        value={item.unitPrice.toString()}
                        onChange={(e) => onChange(item.id, "unitPrice", e.target.value)}
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2 border-b text-right">
                      R {formatCurrency(item.total)}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove(item.id)}
                      >
                        X
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LineItemsTable;
