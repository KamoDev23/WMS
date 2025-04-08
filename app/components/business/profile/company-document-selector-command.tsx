"use client";
import React, { useState, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  EditIcon,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

interface Option {
  value: string;
  label: string;
}

interface DocumentSelectorCommandProps {
  merchantCode: string;
  selected: string;
  onSelect: (value: string) => void;
  hasExpiry: boolean;
  setHasExpiry: (value: boolean) => void;
}

export default function DocumentSelectorCommand({
  merchantCode,
  selected,
  onSelect,
  hasExpiry,
  setHasExpiry
}: DocumentSelectorCommandProps) {
  const [documentOptions, setDocumentOptions] = useState<Option[]>([]);
  const [newOption, setNewOption] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch company document options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const merchantDocRef = doc(db, "merchants", merchantCode);
        const merchantSnap = await getDoc(merchantDocRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          const options: string[] = data.companyDocumentOptions || [];
          setDocumentOptions(options.map((opt) => ({ value: opt, label: opt })));
          // If no option is selected and we have options, select the first one
          if (!selected && options.length > 0) {
            onSelect(options[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching company document options:", error);
        toast.error("Failed to load document options");
      } finally {
        setLoading(false);
      }
    };

    if (merchantCode) {
      fetchOptions();
    }
  }, [merchantCode, onSelect, selected]);

  const updateOptionsInDB = async (options: Option[]) => {
    try {
      const merchantDocRef = doc(db, "merchants", merchantCode);
      await updateDoc(merchantDocRef, {
        companyDocumentOptions: options.map((opt) => opt.value),
      });
      toast.success("Document options updated!");
    } catch (error) {
      console.error("Error updating document options:", error);
      toast.error("Failed to update document options.");
    }
  };

  const addNewOption = async () => {
    const trimmed = newOption.trim();
    if (trimmed && !documentOptions.find((opt) => opt.value === trimmed)) {
      const newOptions = [...documentOptions, { value: trimmed, label: trimmed }];
      setDocumentOptions(newOptions);
      await updateOptionsInDB(newOptions);
      setNewOption("");
      setOpenDialog(false);
      toast.success(`Added new option: ${trimmed}`);
    } else if (trimmed === "") {
      toast.error("Option name cannot be empty");
    } else {
      toast.error("This option already exists");
    }
  };

  const removeOption = async (value: string) => {
    const newOptions = documentOptions.filter((opt) => opt.value !== value);
    setDocumentOptions(newOptions);
    await updateOptionsInDB(newOptions);

    // If the selected option was removed, select the first available option
    if (selected === value && newOptions.length > 0) {
      onSelect(newOptions[0].value);
    } else if (selected === value) {
      onSelect("");
    }

    toast.success("Option removed");
  };

  const startEditing = (value: string) => {
    setIsEditing(value);
    const option = documentOptions.find((opt) => opt.value === value);
    if (option) {
      setEditValue(option.label);
    }
  };

  const saveEdit = async () => {
    if (!isEditing) return;

    const trimmed = editValue.trim();
    if (!trimmed) {
      toast.error("Option name cannot be empty");
      return;
    }

    if (documentOptions.some((opt) => opt.value !== isEditing && opt.value === trimmed)) {
      toast.error("This option already exists");
      return;
    }

    const newOptions = documentOptions.map((opt) =>
      opt.value === isEditing ? { value: trimmed, label: trimmed } : opt
    );

    setDocumentOptions(newOptions);
    await updateOptionsInDB(newOptions);

    // Update selected value if editing the currently selected option
    if (selected === isEditing) {
      onSelect(trimmed);
    }

    setIsEditing(null);
    toast.success("Option updated");
  };

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={loading}
            >
              {loading ? (
                <span className="text-muted-foreground">Loading options...</span>
              ) : (
                <span className={selected ? "" : "text-muted-foreground"}>
                  {selected || "Select document type"}
                </span>
              )}
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="md:min-w-[550px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search document types..." />
              <CommandList>
                <CommandEmpty>No document types found.</CommandEmpty>
                <CommandGroup heading="Available Document Types">
                  {documentOptions.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No document types available.
                    </div>
                  ) : (
                    documentOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        className="flex items-center justify-between"
                        onSelect={() => {
                          if (isEditing !== option.value) {
                            onSelect(option.value);
                            setOpen(false);
                          }
                        }}
                      >
                        {isEditing === option.value ? (
                          <div className="flex flex-1 items-center mr-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex ml-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveEdit();
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckIcon className="h-4 w-4 text-green-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Save</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center">
                              {option.label}
                              {selected === option.value && (
                                <CheckIcon className="h-4 w-4 ml-2 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(option.value);
                                    }}
                                    className="h-8 w-8 p-0 hover:text-blue-500 hover:bg-blue-500/50"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeOption(option.value);
                                    }}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/100"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove</TooltipContent>
                              </Tooltip>
                            </div>
                          </>
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-normal"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add New Document Type
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Document Type</DialogTitle>
                        <DialogDescription>
                          Enter a name for the new document type.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Input
                          placeholder="Document type name"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOpenDialog(false);
                            setNewOption("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={addNewOption}>Add Type</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </TooltipProvider>

      {/* Expiry Date Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="hasExpiry" 
          checked={hasExpiry} 
          onCheckedChange={(checked) => setHasExpiry(checked === true)}
        />
        <Label htmlFor="hasExpiry" className="text-sm font-medium">
          This document has an expiry date
        </Label>
      </div>
    </div>
  );
}