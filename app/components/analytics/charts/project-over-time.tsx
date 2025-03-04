"use client";

import React, { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectData {
  date: string; // e.g. "2025-02-28"
  id: string;
  location: string;
  registrationNumber: string;
  typeOfWork: string;
  vehicleType: string;
}

interface TimeChartData {
  period: string; // e.g. "February 2025"
  count: number;
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

export function ProjectsOverTimeChart() {
  const [data, setData] = useState<TimeChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projects: ProjectData[] = [];
        querySnapshot.forEach((doc) => {
          const project = doc.data() as Omit<ProjectData, "id">;
          projects.push({ id: doc.id, ...project });
        });

        // Group projects by month and year
        const grouped: Record<string, number> = {};
        projects.forEach((proj) => {
          const dateObj = new Date(proj.date);
          const month = monthNames[dateObj.getMonth()];
          const year = dateObj.getFullYear();
          const key = `${month} ${year}`;
          grouped[key] = (grouped[key] || 0) + 1;
        });

        const sortedData: TimeChartData[] = Object.entries(grouped)
          .map(([period, count]) => ({ period, count }))
          .sort((a, b) => {
            const [aMonth, aYear] = a.period.split(" ");
            const [bMonth, bYear] = b.period.split(" ");
            const yearDiff = parseInt(aYear) - parseInt(bYear);
            if (yearDiff !== 0) return yearDiff;
            return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
          });
        setData(sortedData);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartConfig: ChartConfig = {
    desktop: {
      label: "Projects",
      color: "hsl(var(--chart-1))",
    },
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Projects Over Time</CardTitle>
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
          <CardTitle>Projects Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }
  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Projects Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          No data available.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects Over Time</CardTitle>
        <CardDescription>Projects aggregated by month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart data={data} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.split(" ")[0].slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" fill="var(--color-desktop)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total projects for the selected period
        </div>
      </CardFooter>
    </Card>
  );
}
