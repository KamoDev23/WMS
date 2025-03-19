"use client";
import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, CheckCircle, ArrowRight, ArrowDownToLine, Banknote, CheckSquare, ClipboardList, FileText, Receipt, ShieldCheck, Wrench } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchDocumentsForProject } from "@/lib/project-documents";
import { useAuth } from "@/context/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { cn } from "@/lib/utils";

interface ProjectProgressProps {
  projectId: string;
}

// Define the document order that contributes to progress
const documentOrder = [
  "Supplier Quote",
  "Supplier Invoice",
  "Repair Quote",
  "Pre-auth Form",
  "Purchase Order Form",
  "Authorisation Form", 
  "Repair Invoice",
  "Remittance"
];

// Icons for each document type
const docTypeIcons: Record<string, React.ReactNode> = {
    "Supplier Quote": <FileText className="h-5 w-5 text-primary/80" />,
    "Supplier Invoice": <Receipt className="h-5 w-5 text-primary/80" />,
    "Repair Quote": <Wrench className="h-5 w-5 text-primary/80" />,
    "Pre-auth Form": <ShieldCheck className="h-5 w-5 text-primary/80" />,
    "Purchase Order Form": <ClipboardList className="h-5 w-5 text-primary/80" />,
    "Authorisation Form": <CheckSquare className="h-5 w-5 text-primary/80" />,
    "Repair Invoice": <Banknote className="h-5 w-5 text-primary/80" />,
    "Remittance": <ArrowDownToLine className="h-5 w-5 text-primary/80" />,
  };

const ProjectProgress: React.FC<ProjectProgressProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocTypes, setUploadedDocTypes] = useState<string[]>([]);
  const [progress, setProgress] = useState({
    completedSteps: 0,
    totalSteps: documentOrder.length,
    progressPercentage: 0,
    completedDocTypes: [] as string[],
  });

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get the user's merchant code
        const userDoc = await getDocs(collection(db, "users"));
        const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();
        
        if (!userData || !userData.merchantCode) {
          throw new Error("Merchant code not found for user");
        }
        
        // Fetch project documents
        const docs = await fetchDocumentsForProject(userData.merchantCode, projectId);
        
        // Extract unique document types
        const docTypes = [...new Set(docs.map(doc => doc.docType))];
        setUploadedDocTypes(docTypes);
        
        // Calculate progress
        calculateProgress(docTypes);
      } catch (err) {
        console.error("Error fetching document types:", err);
        setError("Failed to load project progress");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, [user, projectId]);

  const calculateProgress = (docTypes: string[]) => {
    // Count how many document types in the expected order are present
    let completedSteps = 0;
    
    for (const docType of documentOrder) {
      if (docTypes.includes(docType)) {
        completedSteps++;
      }
    }
    
    // Calculate percentage
    const progressPercentage = (completedSteps / documentOrder.length) * 100;
    
    setProgress({
      completedSteps,
      totalSteps: documentOrder.length,
      progressPercentage,
      completedDocTypes: documentOrder.filter(docType => docTypes.includes(docType))
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <p>Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center text-destructive py-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Get progress status
  const getProgressStatus = () => {
    if (progress.progressPercentage === 100) {
      return { variant: "default", label: "Complete" };
    } else if (progress.progressPercentage >= 75) {
      return { variant: "default", label: "Advanced" };
    } else if (progress.progressPercentage >= 50) {
      return { variant: "secondary", label: "In Progress" };
    } else if (progress.progressPercentage >= 25) {
      return { variant: "outline", label: "Started" };
    } else {
      return { variant: "outline", label: "Initiated" };
    }
  };

  const progressStatus = getProgressStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Project Progress</span>
          <Badge variant={progressStatus.variant as "default" | "secondary" | "destructive" | "outline"}>
            {progress.completedSteps}/{progress.totalSteps} Steps
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress.progressPercentage)}%</span>
          </div>
          <Progress 
            value={progress.progressPercentage} 
            className="h-2" 
          />
        </div>
        
        <ScrollArea className="h-48 rounded-md border p-4">
          <div className="space-y-4">
            {documentOrder.map((docType, index) => {
              const isCompleted = progress.completedDocTypes.includes(docType);
              const isNext = !isCompleted && 
                index === progress.completedDocTypes.length;
                
              return (
                <TooltipProvider key={docType}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "flex items-center p-2 rounded-md relative border",
                          isCompleted 
                            ? "bg-primary/10 border-primary/20" 
                            : isNext 
                              ? "bg-secondary/20 border-secondary/30" 
                              : "bg-muted border-muted/50"
                        )}
                      >
                        <div className="flex-shrink-0 mr-3 text-center w-8">
                          {docTypeIcons[docType]}
                        </div>
                        <div className="flex-grow">
                          <p className={cn(
                            "font-medium",
                            isCompleted 
                              ? "text-primary" 
                              : isNext 
                                ? "text-secondary-foreground" 
                                : "text-muted-foreground"
                          )}>
                            {docType}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : isNext ? (
                            <ArrowRight className="h-5 w-5 text-secondary animate-pulse" />
                          ) : null}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {isCompleted ? `Completed - Document uploaded` : 
                       isNext ? `Next recommended document to upload` : 
                       `Pending document`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProjectProgress;