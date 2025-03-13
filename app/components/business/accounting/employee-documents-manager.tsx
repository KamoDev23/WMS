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

interface EmployeeDocumentsManagerProps {
  merchantCode: string;
}

export default function EmployeeDocumentsManager({ merchantCode }: EmployeeDocumentsManagerProps) {
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newOption, setNewOption] = useState("");

  // Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const merchantDocRef = doc(db, "merchants", merchantCode);
        const merchantSnap = await getDoc(merchantDocRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          const options: string[] = data.employeeDocumentOptions || [];
          setEmployeeOptions(options.map(opt => ({ value: opt, isEditing: false })));
        }
      } catch (error) {
        console.error("Error fetching employee document options:", error);
      }
    };
    fetchOptions();
  }, [merchantCode]);

  const updateOptionsInDB = async (options: Option[]) => {
    try {
      const merchantDocRef = doc(db, "merchants", merchantCode);
      await updateDoc(merchantDocRef, {
        employeeDocumentOptions: options.map(opt => opt.value),
      });
      toast.success("Employee document settings updated!");
    } catch (error) {
      console.error("Error updating employee document options:", error);
      toast.error("Failed to update employee document options.");
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = employeeOptions.map((opt, i) =>
      i === index ? { ...opt, value } : opt
    );
    setEmployeeOptions(newOptions);
  };

  const toggleEditOption = (index: number) => {
    const newOptions = employeeOptions.map((opt, i) =>
      i === index ? { ...opt, isEditing: true } : opt
    );
    setEmployeeOptions(newOptions);
  };

  const saveOption = async (index: number) => {
    const newOptions = employeeOptions.map((opt, i) =>
      i === index ? { ...opt, isEditing: false } : opt
    );
    setEmployeeOptions(newOptions);
    await updateOptionsInDB(newOptions);
  };

  const removeOption = async (index: number) => {
    const newOptions = employeeOptions.filter((_, i) => i !== index);
    setEmployeeOptions(newOptions);
    await updateOptionsInDB(newOptions);
  };

  const addNewOption = async () => {
    const trimmed = newOption.trim();
    if (trimmed && !employeeOptions.find(opt => opt.value === trimmed)) {
      const newOptions = [...employeeOptions, { value: trimmed, isEditing: false }];
      setEmployeeOptions(newOptions);
      await updateOptionsInDB(newOptions);
      setNewOption("");
      setShowAddInput(false);
    }
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <h2 className="text-xl font-bold mb-2">Employee Documents</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employeeOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No document options added.</p>
          ) : (
            <ul className="space-y-2">
              {employeeOptions.map((option, index) => (
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
                placeholder="New Employee Document Option"
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
