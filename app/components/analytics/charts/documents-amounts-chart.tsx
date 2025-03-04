"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Define the Firestore document type
interface DocumentData {
  id: string;
  amount?: number;
  docType: string;
  fileName: string;
  projectId: string;
  uploadedAt: any; // Firestore Timestamp (or Date)
  url: string;
}

// Chart data structure per month/year
interface ChartData {
  month: string;
  supplierInvoice: number;
  repairQuote: number;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DocumentAmountsAreaChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "projectDocuments"));
        const documents: DocumentData[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<DocumentData, "id">;
          documents.push({ id: doc.id, ...data });
        });

        console.log("Fetched documents:", documents);

        // Filter for documents that are either Supplier Invoice or Repair Quote
        const filteredDocs = documents.filter(
          (doc) =>
            doc.docType === "Supplier Invoice" || doc.docType === "Repair Quote"
        );
        console.log(
          "Filtered documents (Supplier Invoice & Repair Quote):",
          filteredDocs
        );

        // Group the data by month & year using the uploadedAt date
        const monthlyData: Record<
          string,
          { supplierInvoice: number; repairQuote: number }
        > = {};

        filteredDocs.forEach((doc) => {
          // Convert Firestore Timestamp to Date if needed
          const date =
            doc.uploadedAt && typeof doc.uploadedAt.toDate === "function"
              ? doc.uploadedAt.toDate()
              : new Date(doc.uploadedAt);
          const monthName = monthNames[date.getMonth()];
          const year = date.getFullYear();
          // Use a key combining month and year (e.g. "February 2025")
          const key = `${monthName} ${year}`;
          if (!monthlyData[key]) {
            monthlyData[key] = { supplierInvoice: 0, repairQuote: 0 };
          }
          if (doc.docType === "Supplier Invoice") {
            monthlyData[key].supplierInvoice += doc.amount || 0;
          } else if (doc.docType === "Repair Quote") {
            monthlyData[key].repairQuote += doc.amount || 0;
          }
        });
        console.log("Monthly grouped data:", monthlyData);

        // Transform grouped data into an array and sort by year then month order
        const sortedData: ChartData[] = Object.entries(monthlyData)
          .map(([month, data]) => ({
            month,
            supplierInvoice: parseFloat(data.supplierInvoice.toFixed(2)),
            repairQuote: parseFloat(data.repairQuote.toFixed(2)),
          }))
          .sort((a, b) => {
            const [aMonth, aYear] = a.month.split(" ");
            const [bMonth, bYear] = b.month.split(" ");
            const yearDiff = parseInt(aYear) - parseInt(bYear);
            if (yearDiff !== 0) return yearDiff;
            // Compare month indices if years are equal
            return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
          });

        setChartData(sortedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate overall totals and profit/loss:
  // Profit/Loss = Supplier Invoice - Repair Quote
  const totals = useMemo(
    () =>
      chartData.reduce(
        (acc, curr) => ({
          supplierInvoice: acc.supplierInvoice + curr.supplierInvoice,
          repairQuote: acc.repairQuote + curr.repairQuote,
        }),
        { supplierInvoice: 0, repairQuote: 0 }
      ),
    [chartData]
  );
  console.log("Overall totals:", totals);

  const profit = totals.supplierInvoice - totals.repairQuote;
  console.log("Calculated profit (Supplier Invoice - Repair Quote):", profit);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Supplier Invoice vs Repair Quote</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Supplier Invoice vs Repair Quote</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[250px] text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Supplier Invoice vs Repair Quote</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[250px] text-gray-500">
          No data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Invoice vs Repair Quote</CardTitle>
        <CardDescription>Aggregated amounts by month and year</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ left: 70, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Area
              type="monotone"
              dataKey="supplierInvoice"
              stackId="1"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.4}
              name="Supplier Invoice"
            />
            <Area
              type="monotone"
              dataKey="repairQuote"
              stackId="1"
              stroke="#db2777"
              fill="#db2777"
              fillOpacity={0.4}
              name="Repair Quote"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col gap-2 text-sm">
          <div>
            <strong>Total Supplier Invoice:</strong>{" "}
            {formatCurrency(totals.supplierInvoice)}
          </div>
          <div>
            <strong>Total Repair Quote:</strong>{" "}
            {formatCurrency(totals.repairQuote)}
          </div>
          {/* <div>
            <strong>Calculation:</strong> Supplier Invoice - Repair Quote ={" "}
            {formatCurrency(profit)}
          </div> */}
          <div className={profit < 0 ? "text-green-600" : "text-red-600"}>
            {profit < 0
              ? `Profit of ${formatCurrency(Math.abs(profit))}`
              : `Loss of ${formatCurrency(profit)}`}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
