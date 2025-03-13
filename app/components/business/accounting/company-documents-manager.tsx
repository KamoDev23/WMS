"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PlusIcon, Edit, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

interface Option {
  value: string;
  isEditing: boolean;
}

interface CompanyDocumentsManagerProps {
  merchantCode: string;
}

export default function CompanyDocumentsManager({ merchantCode }: CompanyDocumentsManagerProps) {
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newOption, setNewOption] = useState("");

  // Fetch company document options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const merchantDocRef = doc(db, "merchants", merchantCode);
        const merchantSnap = await getDoc(merchantDocRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          const options: string[] = data.companyDocumentOptions || [];
          setCompanyOptions(options.map(opt => ({ value: opt, isEditing: false })));
        }
      } catch (error) {
        console.error("Error fetching company document options:", error);
      }
    };
    fetchOptions();
  }, [merchantCode]);

  const updateOptionsInDB = async (options: Option[]) => {
    try {
      const merchantDocRef = doc(db, "merchants", merchantCode);
      await updateDoc(merchantDocRef, {
        companyDocumentOptions: options.map(opt => opt.value),
      });
      toast.success("Company document settings updated!");
    } catch (error) {
      console.error("Error updating company document options:", error);
      toast.error("Failed to update company document options.");
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = companyOptions.map((opt, i) =>
      i === index ? { ...opt, value } : opt
    );
    setCompanyOptions(newOptions);
  };

  const toggleEditOption = (index: number) => {
    const newOptions = companyOptions.map((opt, i) =>
      i === index ? { ...opt, isEditing: true } : opt
    );
    setCompanyOptions(newOptions);
  };

  const saveOption = async (index: number) => {
    const newOptions = companyOptions.map((opt, i) =>
      i === index ? { ...opt, isEditing: false } : opt
    );
    setCompanyOptions(newOptions);
    await updateOptionsInDB(newOptions);
  };

  const removeOption = async (index: number) => {
    const newOptions = companyOptions.filter((_, i) => i !== index);
    setCompanyOptions(newOptions);
    await updateOptionsInDB(newOptions);
  };

  const addNewOption = async () => {
    const trimmed = newOption.trim();
    if (trimmed && !companyOptions.find(opt => opt.value === trimmed)) {
      const newOptions = [...companyOptions, { value: trimmed, isEditing: false }];
      setCompanyOptions(newOptions);
      await updateOptionsInDB(newOptions);
      setNewOption("");
      setShowAddInput(false);
    }
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <h2 className="text-xl font-bold mb-2">Company Documents</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companyOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No document options added.</p>
          ) : (
            <ul className="space-y-2">
              {companyOptions.map((option, index) => (
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
          {!showAddInput ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 mt-2" onClick={() => setShowAddInput(true)}>
                  <PlusIcon size={16} />
                  Add New Option
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add new option</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center space-x-2 mt-2">
              <Input
                placeholder="New Company Document Option"
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
                  <Button variant="outline" onClick={() => { setShowAddInput(false); setNewOption(""); }}>
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
