"use client";
import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InboxIcon, ExternalLink, ArrowLeft } from "lucide-react";
import { Project } from "@/types/project";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectBacklogProps {
  backlogProjects: Project[];
  onMoveFromBacklog?: (projectId: string) => void;
}

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Open":
      return { variant: "default" as const, className: "bg-blue-500" };
    case "Closed":
      return { variant: "secondary" as const, className: "bg-green-500 text-white" };
    case "In Progress":
      return { variant: "outline" as const, className: "bg-orange-100 text-orange-800 border-orange-300" };
    case "Cancelled":
      return { variant: "destructive" as const };
    case "On Hold":
      return { variant: "outline" as const, className: "bg-amber-100 text-amber-800 border-amber-300" };
    default:
      return { variant: "outline" as const };
  }
};

// Compact Project Card component
const ProjectCard = ({ project, onView, onMove }: {
  project: Project;
  onView: () => void;
  onMove?: () => void;
}) => {
  const statusBadge = getStatusBadge(project.status);
  
  return (
    <Card className="mb-2 overflow-hidden hover:bg-muted/5">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{project.registrationNumber}</span>
              <Badge variant={statusBadge.variant} className={`${statusBadge.className} text-xs`}>
                {project.status}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{project.id}</span>
          </div>
          <div className="flex gap-1">
            {onMove && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMove} 
                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="sr-only">Move to Active</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onView} 
              className="h-8 px-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">View Details</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center mt-1 text-xs text-muted-foreground gap-3">
          <span>{project.vehicleType}</span>
          <span>•</span>
          <span>{project.location}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectBacklogSheet: React.FC<ProjectBacklogProps> = ({
  backlogProjects,
  onMoveFromBacklog,
}) => {
  const router = useRouter();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 relative hover:bg-muted transition-colors"
        >
          <InboxIcon className="h-4 w-4" />
          Backlog
          {backlogProjects.length > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center rounded-full"
            >
              {backlogProjects.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="sm:max-w-md w-full p-0 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="px-6 py-4 bg-card border-b">
            <SheetTitle className="text-lg flex items-center gap-2">
              <InboxIcon className="h-4 w-4 text-muted-foreground" />
              Project Backlog
              {backlogProjects.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {backlogProjects.length}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Projects that are temporarily on hold or deprioritized.
            </SheetDescription>
          </SheetHeader>
         
          <ScrollArea className="flex-1 px-6 py-4">
            {backlogProjects.length === 0 ? (
              <div className="text-center py-8 px-4 border rounded-lg bg-muted/5">
                <InboxIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No projects in backlog</p>
              </div>
            ) : (
              <div>
                {backlogProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={() => router.push(`/projects/${project.id}`)}
                    onMove={onMoveFromBacklog ? () => onMoveFromBacklog(project.id) : undefined}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
         
          <SheetFooter className="px-6 py-3 border-t">
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">Close</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectBacklogSheet;