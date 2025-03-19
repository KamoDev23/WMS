"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Project } from "@/types/project"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  PenToolIcon as Tool, 
  Search, 
  Gauge,
  ArrowRightCircle,
  CheckCircle2,
  AlertCircle,
  XCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, parseISO, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { ProjectCardProgress } from "./project-card-progress"

interface ProjectCardViewProps {
  projects: Project[]
  isLoading: boolean
  merchantCode?: string | null
}

type GroupByOption = "status" | "vehicleType" | "location" | "typeOfWork" | "none"

export const ProjectCardView: React.FC<ProjectCardViewProps> = ({ projects, isLoading }) => {
  const router = useRouter()
  const [groupBy, setGroupBy] = useState<GroupByOption>("status")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])

  // Filter and group projects
  useEffect(() => {
    // Filter projects based on search term
    const filtered = projects.filter(
      (project) =>
        project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.typeOfWork?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (project.location?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (project.vehicleType?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )

    setFilteredProjects(filtered)

    // Initialize all groups as expanded
    if (groupBy !== "none") {
      const groups = getGroupedProjects(filtered)
      const initialExpandedState: Record<string, boolean> = {}

      Object.keys(groups).forEach((group) => {
        initialExpandedState[group] = true
      })

      setExpandedGroups(initialExpandedState)
    }
  }, [projects, searchTerm, groupBy])

  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  // Get grouped projects
  const getGroupedProjects = (projectsToGroup: Project[]) => {
    if (groupBy === "none") return { "All Projects": projectsToGroup }

    return projectsToGroup.reduce((groups: Record<string, Project[]>, project) => {
      const key = project[groupBy]?.toString() || "Unspecified"
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(project)
      return groups
    }, {})
  }

  // Get status details
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "Open":
        return {
          color: "bg-blue-500",
          icon: <ArrowRightCircle className="h-4 w-4 mr-2" />,
          variant: "default" as const,
          className: "bg-blue-500 hover:bg-blue-600 text-white"
        }
      case "In Progress":
        return {
          color: "bg-amber-500",
          icon: <AlertCircle className="h-4 w-4 mr-2" />,
          variant: "outline" as const,
          className: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
        }
      case "Closed":
        return {
          color: "bg-green-500",
          icon: <CheckCircle2 className="h-4 w-4 mr-2" />,
          variant: "secondary" as const,
          className: "bg-green-500 text-white hover:bg-green-600"
        }
      case "Cancelled":
        return {
          color: "bg-red-500",
          icon: <XCircle className="h-4 w-4 mr-1.5" />,
          variant: "destructive" as const,
          className: "bg-red-500 hover:bg-red-600"
        }
      default:
        return {
          color: "bg-gray-500",
          icon: null,
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
        }
    }
  }

  // Calculate project duration
  const getProjectDuration = (project: Project) => {
    const startDate = parseISO(project.dateOpened)
    const endDate = project.dateClosed ? parseISO(project.dateClosed) : new Date()
    return differenceInDays(endDate, startDate)
  }

  // Get progress percentage
  const getProgressPercentage = (project: Project) => {
    if (project.status === "Closed") return 100
    if (project.status === "Cancelled") return 0

    const startDate = parseISO(project.dateOpened)
    const today = new Date()
    const endDate = project.dateClosed ? parseISO(project.dateClosed) : today

    const totalDuration = differenceInDays(endDate, startDate)
    const elapsed = differenceInDays(today, startDate)

    if (totalDuration <= 0) return 0
    return Math.min(100, Math.round((elapsed / totalDuration) * 100))
  }

  // Navigate to project details
  const handleViewDetails = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  // Render project card
  const renderProjectCard = (project: Project) => {
    const progressPercentage = getProgressPercentage(project)
    const duration = getProjectDuration(project)
    const statusDetails = getStatusDetails(project.status)

    return (
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col hover:shadow-md transition-all duration-200 border-t-4 overflow-hidden" style={{ borderTopColor: statusDetails.color.replace('bg-', '') }}>
          <CardHeader className="pb-2 relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{project.registrationNumber}</h3>
                <p className="text-xs text-muted-foreground font-mono">{project.id}</p>
              </div>
              <Badge
                variant={statusDetails.variant}
                className={cn("flex items-center", statusDetails.className)}
              >
                {statusDetails.icon}
                <div className="font-bold">{project.status}</div>
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow space-y-3 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{project.vehicleType || "N/A"}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vehicle Type: {project.vehicleType || "Not specified"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{project.odometerReading ? `${project.odometerReading} km` : "N/A"}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Odometer: {project.odometerReading ? `${project.odometerReading} km` : "Not recorded"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Tool className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{project.typeOfWork || "N/A"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Type of Work: {project.typeOfWork || "Not specified"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{project.location || "N/A"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Location: {project.location || "Not specified"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>

            <div className="border-t border-b border-border py-4 my-1 grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs">Opened: {format(parseISO(project.dateOpened), "MMM d, yyyy")}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs">{duration} days</span>
              </div>
              
              {project.dateClosed && (
                <div className="flex items-center gap-2 col-span-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs">Closed: {format(parseISO(project.dateClosed), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <ProjectCardProgress projectId={project.id} />
          </CardContent>
          
          <CardFooter className="pt-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full hover:bg-muted/50"
              onClick={() => handleViewDetails(project.id)}
            >
              View Details
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // Render group headers with appropriate styling based on group type
  const renderGroupHeader = (groupName: string, count: number) => {
    let icon = null;
    let badgeClass = "";
    
    if (groupBy === "status") {
      const statusDetails = getStatusDetails(groupName);
      icon = statusDetails.icon;
      badgeClass = statusDetails.className;
    } else if (groupBy === "vehicleType") {
      icon = <Car className="h-4 w-4 mr-1.5" />;
    } else if (groupBy === "location") {
      icon = <MapPin className="h-4 w-4 mr-1.5" />;
    } else if (groupBy === "typeOfWork") {
      icon = <Tool className="h-4 w-4 mr-1.5" />;
    }

    return (
      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleGroup(groupName)}>
        <h2 className="text-xl font-bold flex items-center">
          {expandedGroups[groupName] ? (
            <ChevronDown className="h-5 w-5 mr-2" />
          ) : (
            <ChevronUp className="h-5 w-5 mr-2" />
          )}
          <span className="flex items-center">
            
            {groupName}
          </span>
         </h2>
        <Badge variant={groupBy === "status" ? "default" : "outline"} className={groupBy === "status" ? badgeClass : ""}>
          {count}
        </Badge>
      </div>
    );
  };

  // Render grouped projects
  const renderGroupedProjects = () => {
    const groupedProjects = getGroupedProjects(filteredProjects)

    // Sort groups by count (descending)
    const sortedGroups = Object.entries(groupedProjects).sort((a, b) => {
      // For status, maintain a specific order
      if (groupBy === "status") {
        const statusOrder = {
          "Open": 1,
          "In Progress": 2,
          "Closed": 3,
          "Cancelled": 4,
          "Unspecified": 5
        };
        return (statusOrder[a[0] as keyof typeof statusOrder] || 99) - 
               (statusOrder[b[0] as keyof typeof statusOrder] || 99);
      }
      // For other groups, sort by count (descending)
      return b[1].length - a[1].length;
    });

    return sortedGroups.map(([groupName, groupProjects]) => (
      <div key={groupName} className="mb-6">
        {renderGroupHeader(groupName, groupProjects.length)}

        <AnimatePresence>
          {expandedGroups[groupName] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupProjects.map((project) => renderProjectCard(project))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="h-[280px]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ID, registration, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="vehicleType">Vehicle Type</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="typeOfWork">Type of Work</SelectItem>
            <SelectItem value="none">No Grouping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
          {searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </Button>
          )}
        </div>
      ) : groupBy === "none" ? (
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => renderProjectCard(project))}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="h-full">
          {renderGroupedProjects()}
        </ScrollArea>
      )}
      
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>
    </div>
  )
}