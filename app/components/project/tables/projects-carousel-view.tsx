"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Project } from "@/types/project";

interface ProjectsCarouselViewProps {
  projects: Project[];
}

export const ProjectsCarouselView: React.FC<ProjectsCarouselViewProps> = ({
  projects,
}) => {
  // Grouping option: either by vehicleType or location.
  const [groupBy, setGroupBy] = useState<"vehicleType" | "location">("vehicleType");

  const groupedProjects = useMemo(() => {
    return projects.reduce((acc, project) => {
      const key = project[groupBy];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(project);
      return acc;
    }, {} as Record<string, Project[]>);
  }, [projects, groupBy]);

  const groupEntries = useMemo(() => Object.entries(groupedProjects), [groupedProjects]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className=" font-bold"> </h2>
        <Select value={groupBy} onValueChange={(value) => setGroupBy(value as "vehicleType" | "location")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vehicleType">Vehicle Type</SelectItem>
            <SelectItem value="location">Town</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {groupEntries.map(([groupKey, groupProjects]) => (
        <div className="px-15" key={groupKey}>
          <h3 className="text-xl font-semibold mb-2">
            {groupKey} ({groupProjects.length})
          </h3>
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {groupProjects.map((project) => (
                <CarouselItem key={project.id} className="md:basis-1/3 lg:basis-1/6">
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-video items-center justify-center p-6">
                        <div className="text-center">
                          <p className="text-lg font-semibold">{project.registrationNumber}</p>
                          <p className="text-sm">{project.vehicleType}</p>
                          <p className="text-xs text-muted-foreground">{project.location}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ))}
    </div>
  );
};

export default ProjectsCarouselView;
