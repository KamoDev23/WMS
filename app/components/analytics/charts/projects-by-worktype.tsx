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
  merchantCode?: string;
}

interface PieChartData {
  name: string;
  value: number;
}

interface ProjectsByWorkChartProps {
  merchantCode?: string;
}

export function ProjectsByWorkChart({ merchantCode }: ProjectsByWorkChartProps) {
  const [data, setData] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const colors = [
    "#10B981", // emerald-500
    "#059669", // emerald-600
    "#047857", // emerald-700
    "#34D399", // emerald-400
    "#6EE7B7", // emerald-300
    "#A7F3D0", // emerald-200
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use merchant-specific collection if merchantCode is provided.
        const collectionRef = merchantCode
          ? collection(db, "merchants", merchantCode, "projects")
          : collection(db, "projects");

        const querySnapshot = await getDocs(collectionRef);
        const projects: ProjectData[] = [];
        querySnapshot.forEach((docSnap) => {
          const project = docSnap.data() as Omit<ProjectData, "id">;
          projects.push({ id: docSnap.id, ...project });
        });

        // Group projects by type of work
        const grouped: Record<string, number> = {};
        projects.forEach((proj) => {
          const type = proj.typeOfWork || "Unknown";
          grouped[type] = (grouped[type] || 0) + 1;
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
  }, [merchantCode]);

  // Transform data to include fill property for each slice.
  const transformedData = data.map((d, i) => ({
    workType: d.name,
    projects: d.value,
    fill: colors[i % colors.length],
  }));

  // Compute footer summary: total projects and top work type.
  const totalProjects = data.reduce((sum, d) => sum + d.value, 0);
  const topWorkType = data.reduce(
    (max, d) => (d.value > max.value ? d : max),
    { name: "None", value: 0 }
  );

  const chartConfig: ChartConfig = {
    projects: {
      label: "Projects",
    },
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Projects by Type of Work</CardTitle>
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
          <CardTitle>Projects by Type of Work</CardTitle>
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
          <CardTitle>Projects by Type of Work</CardTitle>
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
        <CardTitle>Projects by Type of Work</CardTitle>
        <CardDescription>Distribution of projects by work type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="projects" hideLabel />} />
              <Pie data={transformedData} dataKey="projects" outerRadius={120}>
                {transformedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="workType" className="fill-background" stroke="none" fontSize={12} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          Total Projects: {totalProjects}
        </div>
        <div className="leading-none text-muted-foreground">
          Top Work Type: {topWorkType.name} ({topWorkType.value} projects)
        </div>
      </CardFooter>
    </Card>
  );
}
