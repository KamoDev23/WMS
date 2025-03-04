"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

export interface Invoice {
  id: string;
  date: string; // Format: YYYY-MM-DD
  documentType: string;
  fileName: string;
  amount?: number;
}

const AccountingSection: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const querySnapshot = await getDocs(collection(db, "invoices"));
        const fetched: Invoice[] = [];
        querySnapshot.forEach((docSnap) => {
          // Omit the "id" property from data, since we'll add it from docSnap.id
          const data = docSnap.data() as Omit<Invoice, "id">;
          // Filter invoices by selected month
          if (data.date.startsWith(selectedMonth)) {
            fetched.push({ id: docSnap.id, ...data });
          }
        });
        setInvoices(fetched);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleUpload = () => {
    // Placeholder: Implement your file upload integration (e.g., Firebase Storage)
    alert("Upload Invoice functionality triggered.");
  };

  const handleView = (id: string) => {
    alert(`View invoice ${id}`);
  };

  const handleEdit = (id: string) => {
    alert(`Edit invoice ${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "invoices", id));
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  if (loading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div className="p-4   shadow rounded">
      <h2 className="text-xl font-bold mb-4">Accounting</h2>
      <div className="flex items-center space-x-4 mb-4">
        <label className="text-sm font-medium">Select Month:</label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="border rounded p-2"
        />
        <Button onClick={handleUpload}>Upload Invoice</Button>
      </div>
      {invoices.length > 0 ? (
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Document Type</th>
              <th className="border p-2">File Name</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="text-center">
                <td className="border p-2">{inv.id}</td>
                <td className="border p-2">{inv.date}</td>
                <td className="border p-2">{inv.documentType}</td>
                <td className="border p-2">{inv.fileName}</td>
                <td className="border p-2">
                  {inv.amount ? `$${inv.amount}` : "-"}
                </td>
                <td className="border p-2 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(inv.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(inv.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(inv.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">
          No invoices found for the selected month.
        </p>
      )}
    </div>
  );
};

export default AccountingSection;
