import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash, MoveUp, MoveDown } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface LineItemsFormProps {
  lineItems: LineItem[];
  addLineItem: () => void;
  updateLineItem: (id: string, field: keyof LineItem, value: any) => void;
  removeLineItem: (id: string) => void;
  moveLineItem: (id: string, direction: 'up' | 'down') => void;
  vatRate: number;
  updateField: (field: 'vatRate', value: number) => void;
  subtotal: number;
  vatAmount: number;
  total: number;
}

const LineItemsForm: React.FC<LineItemsFormProps> = ({
  lineItems,
  addLineItem,
  updateLineItem,
  removeLineItem,
  moveLineItem,
  vatRate,
  updateField,
  subtotal,
  vatAmount,
  total
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No items added yet. Click "Add Item" below to get started.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, index) => (
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
                          type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveLineItem(item.id, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                          type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveLineItem(item.id, 'down')}
                            disabled={index === lineItems.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                          type="button"
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
          <Button type="button" onClick={addLineItem} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50">
        <div className="ml-auto w-1/3 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>R {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span>VAT ({vatRate}%):</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={vatRate}
                onChange={(e) => updateField('vatRate', parseFloat(e.target.value) || 0)}
                className="w-16 h-8"
              />
            </div>
            <span>R {vatAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>R {total.toFixed(2)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LineItemsForm;
