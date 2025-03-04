"use client";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

export interface FirebaseChartProps {
  title: string;
  chartType: "bar" | "line" | "pie" | "area";
  collectionName: string;
  height?: number;
}

interface ChartDataItem {
  month: string;
  value1: number;
  value2: number;
  [key: string]: any; // Allow for additional fields
}

// Colors for pie chart segments
const COLORS = ["#2563eb", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];

export const FirebaseChart: React.FC<FirebaseChartProps> = ({
  title,
  chartType,
  collectionName,
  height = 300,
}) => {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      try {
        // Using query to order by month for chronological display
        const dataQuery = query(
          collection(db, collectionName),
          orderBy("month") // Assumes your documents have a 'month' field
        );

        const querySnapshot = await getDocs(dataQuery);

        if (querySnapshot.empty) {
          setError(`No data found in ${collectionName} collection`);
          setChartData([]);
        } else {
          const data: ChartDataItem[] = [];
          querySnapshot.forEach((doc) => {
            data.push(doc.data() as ChartDataItem);
          });
          setChartData(data);
        }
      } catch (error) {
        console.error(
          `Error fetching chart data from ${collectionName}:`,
          error
        );
        setError(`Failed to load data from ${collectionName}`);
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [collectionName]);

  // Transform data for pie chart if needed
  const getPieData = () => {
    // For pie chart, we'll use the latest month data point
    const latestData =
      chartData.length > 0 ? chartData[chartData.length - 1] : null;
    if (!latestData) return [];

    // Create pie segments from the data fields
    return Object.entries(latestData)
      .filter(([key, value]) => key !== "month" && typeof value === "number")
      .map(([key, value]) => ({
        name: key,
        value: value as number,
      }));
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full rounded">
      <ResponsiveContainer width="100%" height={height}>
        {(() => {
          switch (chartType) {
            case "bar":
              return (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value1" name="Value 1" fill="#2563eb" />
                  <Bar dataKey="value2" name="Value 2" fill="#60a5fa" />
                </BarChart>
              );
            case "line":
              return (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value1"
                    name="Value 1"
                    stroke="#2563eb"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value2"
                    name="Value 2"
                    stroke="#60a5fa"
                  />
                </LineChart>
              );
            case "pie":
              const pieData = getPieData();
              return (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, name]} />
                  <Legend />
                </PieChart>
              );
            case "area":
              return (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value1"
                    name="Value 1"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="value2"
                    name="Value 2"
                    stroke="#60a5fa"
                    fill="#60a5fa"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              );
            default:
              return <div>Unsupported chart type</div>;
          }
        })()}
      </ResponsiveContainer>
    </div>
  );
};

export default FirebaseChart;
