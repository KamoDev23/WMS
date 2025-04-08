"use client";
import React, { JSX, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Receipt,
  Wrench,
  ShieldCheck,
  ClipboardList,
  CheckSquare,
  Banknote,
  ArrowDownToLine,
  CheckCircle,
  X,
  Check,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { fetchProjectsForMerchant } from "@/lib/fetch-projects";
import { fetchDocumentsForProject } from "@/lib/project-documents";
import { cn } from "@/lib/utils";
import { Project } from "@/types/project";

// Define the document order that contributes to progress
const documentOrder = [
  "Supplier Quote",
  "Supplier Invoice",
  "Repair Quote",
  "Pre-auth Form",
  "Purchase Order Form",
  "Authorisation Form",
  "Repair Invoice",
  "Remittance",
];

// Icons for each document type
const docTypeIcons: { [key: string]: JSX.Element } = {
  "Supplier Quote": <FileText className="h-4 w-4" />,
  "Supplier Invoice": <Receipt className="h-4 w-4" />,
  "Repair Quote": <Wrench className="h-4 w-4" />,
  "Pre-auth Form": <ShieldCheck className="h-4 w-4" />,
  "Purchase Order Form": <ClipboardList className="h-4 w-4" />,
  "Authorisation Form": <CheckSquare className="h-4 w-4" />,
  "Repair Invoice": <Banknote className="h-4 w-4" />,
  "Remittance": <ArrowDownToLine className="h-4 w-4" />,
};

interface ProjectDocumentsTableProps {
  projects?: Project[];
  merchantCode?: string;
  onRefresh?: () => void;
}

const ProjectDocumentsTable: React.FC<ProjectDocumentsTableProps> = ({
  projects: externalProjects,
  merchantCode: externalMerchantCode,
  onRefresh: externalRefresh,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [projectDocuments, setProjectDocuments] = useState<Record<string, string[]>>({});
  const [progressData, setProgressData] = useState<Record<string, { completedSteps: number; totalSteps: number; progressPercentage: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");

  // Determine if we're using external or internal data
  const isExternalData = externalProjects !== undefined && externalMerchantCode !== undefined;

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      if (isExternalData) {
        setProjects(externalProjects || []);
        setMerchantCode(externalMerchantCode || null);
        setLoading(false);
        return;
      }

      if (!user) return;

      try {
        setLoading(true);
        // Get the user's merchant code
        const userDoc = await getDocs(collection(db, "users"));
        const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();

        if (!userData || !userData.merchantCode) {
          throw new Error("Merchant code not found for user");
        }

        setMerchantCode(userData.merchantCode);

        // Fetch projects
        const fetchedProjects = await fetchProjectsForMerchant(userData.merchantCode);
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load projects data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isExternalData, externalProjects, externalMerchantCode]);

  useEffect(() => {
    setLoading(true);

    const fetchDocumentsData = async () => {
      if (!merchantCode || projects.length === 0) return;

      try {
        const documentsData: Record<string, string[]> = {};
        const progressInfo: Record<string, { completedSteps: number; totalSteps: number; progressPercentage: number }> = {};

        for (const project of projects) {
          const docs = await fetchDocumentsForProject(merchantCode, project.id);
          const docTypes = [...new Set(docs.map(doc => doc.docType))];
          documentsData[project.id] = docTypes;

          // Calculate progress
          let completedSteps = 0;
          for (const docType of documentOrder) {
            if (docTypes.includes(docType)) {
              completedSteps++;
            }
          }
          const progressPercentage = (completedSteps / documentOrder.length) * 100;
          
          progressInfo[project.id] = {
            completedSteps,
            totalSteps: documentOrder.length,
            progressPercentage,
          };
        }

        setProjectDocuments(documentsData);
        setProgressData(progressInfo);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Failed to load document data");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentsData();
  }, [merchantCode, projects]);

  const handleRefresh = async () => {
    if (externalRefresh) {
      externalRefresh();
    } else {
      try {
        setLoading(true);
        const fetchedProjects = await fetchProjectsForMerchant(merchantCode!);
        setProjects(fetchedProjects);
        
        // Refresh documents data as well
        const documentsData: Record<string, string[]> = {};
        const progressInfo: Record<string, { completedSteps: number; totalSteps: number; progressPercentage: number }> = {};
        
        for (const project of fetchedProjects) {
          const docs = await fetchDocumentsForProject(merchantCode!, project.id);
          const docTypes = [...new Set(docs.map(doc => doc.docType))];
          documentsData[project.id] = docTypes;
          
          // Calculate progress
          let completedSteps = 0;
          for (const docType of documentOrder) {
            if (docTypes.includes(docType)) {
              completedSteps++;
            }
          }
          const progressPercentage = (completedSteps / documentOrder.length) * 100;
          
          progressInfo[project.id] = {
            completedSteps,
            totalSteps: documentOrder.length,
            progressPercentage,
          };
        }
        
        setProjectDocuments(documentsData);
        setProgressData(progressInfo);
      } catch (error) {
        console.error("Error refreshing projects:", error);
        setError("Failed to refresh data");
      } finally {
        setLoading(false);
      }
    }
  };

  // Get progress status label
  const getProgressStatus = (percentage: number) => {
    if (percentage === 100) return "Complete";
    if (percentage >= 75) return "Advanced";
    if (percentage >= 50) return "In Progress";
    if (percentage >= 25) return "Started";
    return "Initiated";
  };

  // Get variant for badge
  const getProgressVariant = (percentage: number) => {
    if (percentage === 100) return "default";
    if (percentage >= 50) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Documents Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <p>Loading documents data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Documents Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center text-destructive py-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Filter the projects based on search query and status filter
  const filteredProjects = projects.filter(project => {
    // Apply search filter (on project ID)
    const matchesSearch = project.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    let matchesStatus = true;
    if (statusFilter !== "all") {
      const progress = progressData[project.id];
      if (progress) {
        const percentage = progress.progressPercentage;
        const status = getProgressStatus(percentage).toLowerCase().replace(" ", "-");
        matchesStatus = status === statusFilter;
      } else {
        matchesStatus = false;
      }
    }
    
    // Apply document filter
    let matchesDocument = true;
    if (documentFilter !== "all") {
      const docTypes = projectDocuments[project.id] || [];
      matchesDocument = docTypes.includes(documentFilter);
    }
    
    return matchesSearch && matchesStatus && matchesDocument;
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">Project Documents Overview</CardTitle>
          <CardDescription>Track document uploads across all projects</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-row gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={documentFilter}
              onValueChange={setDocumentFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {documentOrder.map(docType => (
                  <SelectItem key={docType} value={docType}>
                    {docType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Project</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                {documentOrder.map((docType) => (
                  <TableHead key={docType} className="text-center w-[90px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex flex-col items-center justify-center gap-1">
                          {docTypeIcons[docType as keyof typeof docTypeIcons]}
                          <span className="text-xs font-normal truncate max-w-[70px]">
                            {docType}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{docType}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
                <TableHead className="text-right w-[120px]">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={documentOrder.length + 3} className="text-center py-6 text-muted-foreground">
                    No projects found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => {
                  const docTypes = projectDocuments[project.id] || [];
                  const progress = progressData[project.id] || {
                    completedSteps: 0,
                    totalSteps: documentOrder.length,
                    progressPercentage: 0,
                  };
                  
                  const progressPercentage = progress.progressPercentage;
                  const statusLabel = getProgressStatus(progressPercentage);
                  const variant = getProgressVariant(progressPercentage);
                  
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{project.id}</span>
                          <span className="text-xs text-muted-foreground">
                           {project.typeOfWork}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={variant}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      {documentOrder.map((docType) => {
                        const isUploaded = docTypes.includes(docType);
                        return (
                          <TableCell key={docType} className="text-center">
                            {isUploaded ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1 items-end">
                          <span className="text-xs">{progress.completedSteps}/{progress.totalSteps}</span>
                          <Progress
                            value={progressPercentage}
                            className="h-2 w-[100px]"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <div className="p-4 text-sm text-muted-foreground border-t">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>
    </Card>
  );
};

export default ProjectDocumentsTable;