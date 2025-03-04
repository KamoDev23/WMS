"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DollarSign, FileText, RotateCcw, CheckCircle } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

export interface AccountingDocument {
  id: string;
  docType:
    | "Supplier Quote"
    | "Supplier Invoice"
    | "Repair Quote"
    | "Remittance";
  fileName: string;
  url: string;
  uploadedAt: Date;
  projectId: string;
  amount?: number;
}

interface AccountingSectionProps {
  projectId: string;
}

// Helper function to format currency as "R 100 000.00"
const formatCurrency = (value: number): string => {
  // Format value to a string with exactly two decimals.
  const formatted = value.toFixed(2); // e.g., "182923.21"
  const [integerPart, decimalPart] = formatted.split(".");
  // Insert spaces as thousand separators into the integer part.
  const spacedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${spacedInteger}.${decimalPart}`;
};

export const AccountingSection: React.FC<AccountingSectionProps> = ({
  projectId,
}) => {
  const [docs, setDocs] = useState<AccountingDocument[]>([]);

  // Fetch accounting-related documents from Firestore
  const fetchDocuments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "projectDocuments"));
      const fetched: AccountingDocument[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<AccountingDocument, "id">;
        if (
          data.projectId === projectId &&
          [
            "Supplier Quote",
            "Supplier Invoice",
            "Repair Quote",
            "Remittance",
          ].includes(data.docType)
        ) {
          fetched.push({ id: docSnap.id, ...data } as AccountingDocument);
        }
      });
      setDocs(fetched);
    } catch (error) {
      console.error("Error fetching accounting documents:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  // Calculations:
  const estimatedExpenditure = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Supplier Quote")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  const totalExpenditure = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Supplier Invoice")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  // Raw invoice amount (before deduction) from Repair Quote documents
  const rawRepairQuote = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Repair Quote")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  const estimatedRemittance = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Repair Quote")
      .reduce((sum, doc) => sum + (doc.amount || 0) * (1 - 0.068999), 0);
  }, [docs]);

  const actualRemittance = useMemo(() => {
    return docs
      .filter((doc) => doc.docType === "Remittance")
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [docs]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Accounting</h2>
      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Estimated Expenditure */}
        <Card>
          <CardHeader className="flex items-left">
            <h3 className="text-lg font-bold">Estimated Expenditure</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tighter">
              ≈ {formatCurrency(estimatedExpenditure)}
            </p>
          </CardContent>
        </Card>

        {/* Total Expenditure */}
        <Card>
          <CardHeader className="flex items-left">
            <h3 className="text-lg font-bold">Total Expenditure</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tighter">
              {formatCurrency(totalExpenditure)}
            </p>
          </CardContent>
        </Card>

        {/* Invoice Amount (Raw Repair Quote Total) */}
        <Card>
          <CardHeader className="flex items-left">
            <h3 className="text-lg font-bold">Invoice Amount</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tighter">
              {formatCurrency(rawRepairQuote)}
            </p>
          </CardContent>
        </Card>

        {/* Estimated Remittance */}
        <Card>
          <CardHeader className="flex items-left">
            <h3 className="text-lg font-bold">Estimated Remittance</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tighter">
              ≈ {formatCurrency(estimatedRemittance)}
            </p>
          </CardContent>
        </Card>

        {/* Actual Remittance */}
        <Card>
          <CardHeader className="flex items-left">
            <h3 className="text-lg font-bold">Actual Remittance</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tighter">
              {formatCurrency(actualRemittance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <div>
        <h3 className="text-xl font-bold mb-2">Document Details</h3>
        {docs.length === 0 ? (
          <p className="text-muted-foreground">
            No accounting documents uploaded yet.
          </p>
        ) : (
          docs.map((doc, index) => (
            <Card key={doc.id} className="p-4 mb-4">
              <div className="flex flex-col space-y-2">
                <div>
                  <p className="font-medium">Document:</p>
                  <p className="text-sm">
                    {doc.fileName} ({index + 1})
                  </p>
                  <p className="text-xs text-muted-foreground">{doc.docType}</p>
                </div>
                <div>
                  <Label className="whitespace-nowrap">
                    Amount:{" "}
                    {formatCurrency(doc.amount !== undefined ? doc.amount : 0)}
                  </Label>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountingSection;
