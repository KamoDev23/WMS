"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, ResponsiveContainer, LabelList, Cell } from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ProjectData {
  date: string;
  id: string;
  location: string;
  registrationNumber: string;
  typeOfWork: string;
  vehicleType: string;
}

interface PieChartData {
  name: string;
  value: number;
}

export function ProjectsByLocationChart() {
  const [data, setData] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const colors = [
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#16a34a",
    "#f59e0b",
    "#ef4444",
  ];

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

        // Group projects by location
        const grouped: Record<string, number> = {};
        projects.forEach((proj) => {
          const loc = proj.location || "Unknown";
          grouped[loc] = (grouped[loc] || 0) + 1;
        });

        const pieData: PieChartData[] = Object.entries(grouped).map(
          ([name, value]) => ({ name, value })
        );
        setData(pieData);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform data to include a fill property for each slice
  const transformedData = data.map((d, i) => ({
    location: d.name,
    projects: d.value,
    fill: colors[i % colors.length],
  }));

  // A simple chart config for our tooltip.
  const chartConfig: ChartConfig = {
    projects: {
      label: "Projects",
    },
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Projects by Location</CardTitle>
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
          <CardTitle>Projects by Location</CardTitle>
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
          <CardTitle>Projects by Location</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          No data available.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Projects by Location</CardTitle>
        <CardDescription>Distribution of projects by location</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="projects" hideLabel />}
              />
              <Pie data={transformedData} dataKey="projects" outerRadius={80}>
                {transformedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="location"
                  className="fill-background"
                  stroke="none"
                  fontSize={12}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing distribution of projects by location
        </div>
      </CardFooter>
    </Card>
  );
}
