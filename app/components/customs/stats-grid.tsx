import { cn } from "@/lib/utils";
import { CircleArrowOutUpRight } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Project } from "@/types/project";

interface StatsCardProps {
  title: string;
  value: string;
  insight: string;
  icon: React.ReactNode;
  projects: Project[];
  statType: 'open' | 'closed' | 'total' | 'completion';
}

export function StatsCard({ title, value, insight, icon, projects, statType }: StatsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter projects based on the stat type
  const getFilteredProjects = (): Project[] => {
    switch (statType) {
      case 'open':
        return projects.filter(p => p.status === "Open");
      case 'closed':
        return projects.filter(p => p.status === "Closed");
      case 'total':
        return projects.filter(p => p.status !== "Cancelled");
      case 'completion':
        return projects.filter(p => p.status === "Closed");
      default:
        return [];
    }
  };

  const filteredProjects = getFilteredProjects();
  
  return (
    <>
      <div 
        className={`relative p-4 lg:p-5 group before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden ${statType !== 'completion' ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
        onClick={() => statType !== 'completion' && setDialogOpen(true)}
      >
        <div className="relative flex items-center gap-4">
          {statType !== 'completion' && (
            <CircleArrowOutUpRight
              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500"
              size={20}
              aria-hidden="true"
            />
          )}
          {/* Icon */}
          <div className="max-[480px]:hidden size-10 shrink-0 rounded-full bg-emerald-600/25 border border-emerald-600/50 flex items-center justify-center text-emerald-500">
            {icon}
          </div>
          {/* Content */}
          <div>
            <p className="font-medium tracking-widest text-xs uppercase text-muted-foreground/60">
              {title}
            </p>
            <div className="text-2xl font-semibold mb-2">{value}</div>
            <div className="text-xs text-muted-foreground/60">
              {insight}
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{title} Details</DialogTitle>
            <DialogDescription>
              {statType === 'completion' 
                ? 'Projects contributing to the completion rate' 
                : `Showing ${filteredProjects.length} projects`}
            </DialogDescription>
          </DialogHeader>

          {filteredProjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Type of Work</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Opened</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.id}</TableCell>
                    <TableCell>{project.registrationNumber}</TableCell>
                    <TableCell>{project.typeOfWork}</TableCell>
                    <TableCell>
                      <Badge variant={project.status === "Open" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.dateOpened}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Close dialog and navigate to project detail
                          setDialogOpen(false);
                          // This would typically use router.push in a Next.js app
                          // router.push(`/projects/${project.id}`);
                          // For demo, just log the action
                          console.log(`View project: ${project.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No projects found for this category.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface StatsGridProps {
  stats: Omit<StatsCardProps, 'projects' | 'statType'>[];
  projects: Project[];
}

export function StatsGrid({ stats, projects }: StatsGridProps) {
  // Map stat titles to their corresponding statTypes
  const getStatType = (title: string): 'open' | 'closed' | 'total' | 'completion' => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('open')) return 'open';
    if (titleLower.includes('closed')) return 'closed';
    if (titleLower.includes('total')) return 'total';
    if (titleLower.includes('completion')) return 'completion';
    return 'total'; // Default fallback
  };

  return (
    <div className="grid grid-cols-2 min-[1200px]:grid-cols-4 border border-border rounded-xl bg-gradient-to-br from-sidebar/60 to-sidebar">
      {stats.map((stat) => (
        <StatsCard 
          key={stat.title} 
          {...stat} 
          projects={projects}
          statType={getStatType(stat.title)}
        />
      ))}
    </div>
  );
}