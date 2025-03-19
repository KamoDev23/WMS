import { useRef, useState, useEffect, useMemo } from "react"
import type { Project } from "@/types/project"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Filter, 
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightCircle,
  XCircle,
  MapPin,
  Wrench,
   
} from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  differenceInDays,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  isToday,
  isSameMonth,
  isSameYear
} from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface GanttChartProps {
  projects: Project[]
  isLoading: boolean
}

export const GanttChart = ({ projects, isLoading }: GanttChartProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all")
  
  // Use useRef to keep track of projects to prevent unnecessary recalculations
  const projectsRef = useRef(projects)

  // Memoize the start/end dates and total days for the current period (1 month)
  const { startDate, endDate, totalDays } = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return {
      startDate: start,
      endDate: end,
      totalDays: differenceInDays(end, start) + 1,
    }
  }, [currentDate])

  // Generate array of days for the period
  const daysArray = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      return date
    })
  }, [totalDays, startDate])

  // Filter projects based on selected filters and date range
  useEffect(() => {
    // Only update if projects have changed
    if (JSON.stringify(projectsRef.current) !== JSON.stringify(projects)) {
      projectsRef.current = projects
    }
    
    if (!projectsRef.current.length) {
      setFilteredProjects([])
      return
    }

    let filtered = [...projectsRef.current]

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter)
    }

    // Filter by vehicle type
    if (vehicleTypeFilter !== "all") {
      filtered = filtered.filter((project) => project.vehicleType === vehicleTypeFilter)
    }

    // Filter projects that are active in the current month view
    filtered = filtered.filter((project) => {
      const projectStart = parseISO(project.dateOpened)
      const projectEnd = project.dateClosed ? parseISO(project.dateClosed) : new Date()

      // Check if project overlaps with current month view
      return (
        isWithinInterval(projectStart, { start: startDate, end: endDate }) ||
        isWithinInterval(projectEnd, { start: startDate, end: endDate }) ||
        (projectStart <= startDate && projectEnd >= endDate)
      )
    })

    // Sort projects by start date
    filtered.sort((a, b) => parseISO(a.dateOpened).getTime() - parseISO(b.dateOpened).getTime())

    setFilteredProjects(filtered)
  }, [projects, statusFilter, vehicleTypeFilter, startDate, endDate])

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1))
  }

  // Calculate position and width for a project bar relative to the current period
  const calculateBarPosition = (project: Project) => {
    const projectStart = parseISO(project.dateOpened)
    const projectEnd = project.dateClosed ? parseISO(project.dateClosed) : new Date()

    // Calculate start position in days from the period start
    const startPosition = Math.max(0, differenceInDays(projectStart, startDate))
    // Calculate end position capped to the period
    const endPosition = Math.min(totalDays - 1, differenceInDays(projectEnd, startDate))
    // Width in days (at least 1 day)
    const width = Math.max(1, endPosition - startPosition + 1)

    return {
      left: `${(startPosition / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`,
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-500"
      case "In Progress":
        return "bg-amber-500"
      case "Closed":
        return "bg-green-500"
      case "Cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status variant for badge
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Open":
        return "default"
      case "In Progress":
        return "secondary"
      case "Closed":
        return "outline"
      case "Cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <ArrowRightCircle className="h-3 w-3 mr-1" />
      case "In Progress":
        return <AlertCircle className="h-3 w-3 mr-1" />
      case "Closed":
        return <CheckCircle2 className="h-3 w-3 mr-1" />
      case "Cancelled":
        return <XCircle className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  // Get unique vehicle types from projects
  const vehicleTypes = useMemo(() => {
    return ["all", ...Array.from(new Set(projects.map((p) => p.vehicleType).filter(Boolean)))]
  }, [projects])

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" /> 
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" /> 
            Project Timeline
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Vehicle: {vehicleTypeFilter === "all" ? "All" : vehicleTypeFilter}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                  <SelectTrigger className="w-full border-0">
                    <SelectValue placeholder="Vehicle Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "all" ? "All Vehicles" : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Period navigation */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="text-sm text-muted-foreground">
            {filteredProjects.length} projects in view
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth} className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="text-sm font-medium px-4 min-w-28 text-center">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="outline" size="sm" onClick={nextMonth} className="flex items-center">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          {/* Days header */}
          <div className="grid grid-cols-[150px_minmax(0,1fr)] border-b">
            <div className="border-r px-2 py-1 text-sm font-medium">Project</div>
            <div className="flex">
              {daysArray.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative flex-1 min-w-8",
                    day.getDay() === 0 || day.getDay() === 6 ? "bg-sidebar" : ""
                  )}
                >
                  <div
                    className={cn(
                      "text-center text-xs py-1",
                      day.getDay() === 0 || day.getDay() === 6 ? "text-gray-500" : "",
                      isToday(day) ? "bg-blue-300 font-bold" : ""
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project bars */}
          <ScrollArea className="h-[500px]">
            <div>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No projects found for the selected filters and time period.
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const barStyle = calculateBarPosition(project)
                  return (
                    <div key={project.id} className="grid grid-cols-[150px_minmax(0,1fr)] border-b relative h-12">
                      {/* Project name column - fixed width */}
                      <div className="border-r px-2 flex items-center truncate">
                        <div className="truncate font-medium text-sm">
                          {project.registrationNumber}
                        </div>
                      </div>
                      
                      {/* Timeline grid column */}
                      <div className="relative">
                        {/* Vertical gridlines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {daysArray.map((day, index) => (
                            <div 
                              key={index} 
                              className={cn(
                                "flex-1 min-w-8 border-r border-gray-100",
                                day.getDay() === 0 ? "border-gray-200" : "",
                                isToday(day) ? "bg-blue-50/30" : ""
                              )} 
                            />
                          ))}
                        </div>

                        {/* Project bar */}
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <Link href={`/projects/${project.id}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md ${getStatusColor(project.status)} text-primary-foreground dark:text-primary-foreground text-xs flex items-center justify-start px-2 truncate shadow hover:h-8 transition-all cursor-pointer`}
                                  style={barStyle}
                                >
                                  <span className="truncate">{project.id}</span>
                                </div>
                              </TooltipTrigger>
                            </Link>
                            <TooltipContent side="top" className="max-w-xs p-4 bg-sidebar z-50">
                              <div className="space-y-3">
                                <div className="font-semibold text-gray-500 text-sm border-b pb-2">{project.registrationNumber}</div>
                                
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm text-gray-500">{project.typeOfWork || "No work type specified"}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm text-gray-500">{project.location || "No location specified"}</span>
                                  </div>
                                  
                                  <div className="flex items-center text-xs border-t pt-2 mt-1">
                                    <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-gray-500">
                                      {format(parseISO(project.dateOpened), "MMM d, yyyy")} 
                                      {" → "} 
                                      {project.dateClosed ? format(parseISO(project.dateClosed), "MMM d, yyyy") : "ongoing"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-1">
                                  <Badge variant={getStatusVariant(project.status)} className="flex items-center">
                                    {getStatusIcon(project.status)}
                                    {project.status}
                                  </Badge>
                                  {project.vehicleType && (
                                    <Badge variant="outline" className="flex items-center">
                                      <Car className="mr-1 h-3 w-3" />
                                      {project.vehicleType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}