"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PlusIcon, Edit, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

// Define your category type and options.
export type AccountingCategory =
  | "Recurring Expenditure"
  | "Contingent Expenses"
  | "Compensation"
  | "Bank Statements"
  | "Income (Remittances)"
  | "Fuel & Maintenance";

const categoryOptions: AccountingCategory[] = [
  "Recurring Expenditure",
  "Contingent Expenses",
  "Compensation",
  "Bank Statements",
  "Income (Remittances)",
  "Fuel & Maintenance",
];

// Option interface for individual document options.
interface Option {
  value: string;
  isEditing: boolean;
}

export default function AccountingDocumentsManager({ merchantCode }: { merchantCode: string }) {
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState<AccountingCategory>(categoryOptions[0]);

  // State for options per category – mapping category => Option[]
  const [accountingDocsByCategory, setAccountingDocsByCategory] = useState<Record<AccountingCategory, Option[]>>({} as Record<AccountingCategory, Option[]>);

  // State for new option input for current category
  const [showAddInput, setShowAddInput] = useState(false);
  const [newOption, setNewOption] = useState("");

  // On mount, fetch the merchant document and initialize state.
  useEffect(() => {
    const fetchMerchantDoc = async () => {
      try {
        const merchantDocRef = doc(db, "merchants", merchantCode);
        const merchantSnap = await getDoc(merchantDocRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          // Expecting accountingDocumentOptions to be an object with keys from categoryOptions and arrays of strings as values.
          const raw = data.accountingDocumentOptions || {};
          const parsed: Record<AccountingCategory, Option[]> = {} as Record<AccountingCategory, Option[]>;
          categoryOptions.forEach((cat) => {
            const arr: string[] = raw[cat] || [];
            parsed[cat] = arr.map((opt) => ({ value: opt, isEditing: false }));
          });
          setAccountingDocsByCategory(parsed);
        } else {
          // Initialize with empty arrays if no document exists
          const init: Record<AccountingCategory, Option[]> = {} as Record<AccountingCategory, Option[]>;
          categoryOptions.forEach((cat) => (init[cat] = []));
          setAccountingDocsByCategory(init);
        }
      } catch (error) {
        console.error("Error fetching merchant document:", error);
      }
    };
    fetchMerchantDoc();
  }, [merchantCode]);

  // Helper: update Firestore for accounting document options.
  const updateAccountingDocsInDB = async (updatedDocs: Record<AccountingCategory, Option[]>) => {
    try {
      const merchantDocRef = doc(db, "merchants", merchantCode);
      // Convert each Option[] to an array of strings.
      const payload = Object.fromEntries(
        categoryOptions.map((cat) => [cat, (updatedDocs[cat] || []).map((opt) => opt.value)])
      );
      await updateDoc(merchantDocRef, {
        accountingDocumentOptions: payload,
      });
      toast.success("Accounting document settings updated!");
    } catch (error) {
      console.error("Error updating accounting document settings:", error);
      toast.error("Failed to update accounting document settings.");
    }
  };

  // Handlers for the selected category
  const handleOptionChange = (index: number, value: string) => {
    setAccountingDocsByCategory((prev) => {
      const current = prev[selectedCategory] || [];
      const newOptions = current.map((opt, i) => (i === index ? { ...opt, value } : opt));
      return { ...prev, [selectedCategory]: newOptions };
    });
  };

  const toggleEditOption = (index: number) => {
    setAccountingDocsByCategory((prev) => {
      const current = prev[selectedCategory] || [];
      const newOptions = current.map((opt, i) =>
        i === index ? { ...opt, isEditing: true } : opt
      );
      return { ...prev, [selectedCategory]: newOptions };
    });
  };

  const saveOption = async (index: number) => {
    setAccountingDocsByCategory((prev) => {
      const current = prev[selectedCategory] || [];
      const newOptions = current.map((opt, i) =>
        i === index ? { ...opt, isEditing: false } : opt
      );
      return { ...prev, [selectedCategory]: newOptions };
    });
    await updateAccountingDocsInDB(accountingDocsByCategory);
  };

  const removeOption = async (index: number) => {
    setAccountingDocsByCategory((prev) => {
      const current = prev[selectedCategory] || [];
      const newOptions = current.filter((_, i) => i !== index);
      return { ...prev, [selectedCategory]: newOptions };
    });
    await updateAccountingDocsInDB(accountingDocsByCategory);
  };

  const addNewOption = async () => {
    const trimmed = newOption.trim();
    if (trimmed && !((accountingDocsByCategory[selectedCategory] || []).find((opt) => opt.value === trimmed))) {
      const current = accountingDocsByCategory[selectedCategory] || [];
      const newOptions = [...current, { value: trimmed, isEditing: false }];
      setAccountingDocsByCategory((prev) => ({ ...prev, [selectedCategory]: newOptions }));
      await updateAccountingDocsInDB({ ...accountingDocsByCategory, [selectedCategory]: newOptions });
      setNewOption("");
      setShowAddInput(false);
    }
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <h2 className="text-xl font-bold mb-2">Accounting Documents</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Category Selection */}
          <div>
            <Label className="block text-sm font-medium">Select Category</Label>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as AccountingCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Options List for the selected category */}
          <div>
            <p className=" text-sm mb-2">
              Options for <strong>{selectedCategory}</strong>:
            </p>
            {!(accountingDocsByCategory[selectedCategory] && accountingDocsByCategory[selectedCategory].length) ? (
              <p className="text-sm text-muted-foreground">
                No options added.
              </p>
            ) : (
              <ul className="space-y-2">
                {accountingDocsByCategory[selectedCategory].map((option, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={option.value}
                      readOnly={!option.isEditing}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full"
                    />
                    {option.isEditing ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => saveOption(index)}>
                            <Check size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save option</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => toggleEditOption(index)}>
                            <Edit size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit option</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => removeOption(index)}>
                          <Trash2 size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove option</TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add New Option */}
          {!showAddInput ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-4 mt-2"
                  onClick={() => setShowAddInput(true)}
                >
                  <PlusIcon size={16} />
                  Add New Option
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add new option</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center space-x-2 mt-2">
              <Input
                placeholder="New Accounting Document Option"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={addNewOption}>
                    <Check size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Confirm new option</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddInput(false);
                      setNewOption("");
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
