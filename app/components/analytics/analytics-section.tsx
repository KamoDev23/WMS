"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FirebaseChart from "./charts/dummy-chart";
import { DocumentAmountsAreaChart } from "./charts/documents-amounts-chart";
import { ProjectsOverTimeChart } from "./charts/project-over-time";
import { ProjectsByLocationChart } from "./charts/projects-by-location";
import { ProjectsByWorkChart } from "./charts/projects-by-worktype";

export const AnalyticsSection: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>("month");

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  return (
    <section className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select defaultValue="month" onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-lg font-bold mb-2">Active Projects</p>
          <ProjectsOverTimeChart />
        </div>
        <div>
          <p className="text-lg font-bold mb-2">Active Projects</p>
          <DocumentAmountsAreaChart />
        </div>
        <div>
          <p className="text-lg font-bold mb-2">Project Distribution</p>
          <ProjectsByLocationChart />
        </div>
        <div>
          <p className="text-lg font-bold mb-2">Work Type Distribution</p>
          <ProjectsByWorkChart />
        </div>
      </div>
    </section>
  );
};

export default AnalyticsSection;
