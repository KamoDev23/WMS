"use client";
import React, { useState, useEffect } from "react";
import AnalyticsSection from "../components/analytics/analytics-section";
import ProjectHistoryTable from "../components/project/tables/project-history-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "../components/customs/stats-grid";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon, FolderOpen, CheckCircle, Target, TrendingUp, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { collection, doc, getDocs, setDoc, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import CreateProjectModal, { NewProject } from "../components/project/create-project-modal";
import { Project } from "@/types/project";
import { fetchProjects, fetchProjectsForMerchant } from "../../lib/fetch-projects";
import { useAuth } from "@/context/auth-context";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [merchantCode, setMerchantCode] = useState<string | null>(null);

  // Fetch all projects from Firestore
  useEffect(() => {
    if (!user) return;
    loadProjects();
  }, [user]);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      // Get the user's merchant code
      const userDoc = await getDocs(collection(db, "users"));
      const userData = userDoc.docs.find((doc) => doc.id === user?.uid)?.data();
      
      if (!userData || !userData.merchantCode) {
        console.error("Merchant code not found for user");
        setLoadingProjects(false);
        return;
      }
      
      setMerchantCode(userData.merchantCode);
      
      // Get projects for this merchant
      const fetchedProjects = await fetchProjectsForMerchant(userData.merchantCode);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  // Calculate metrics
  const openCount = projects.filter((p) => p.status === "Open").length;
  const closedCount = projects.filter((p) => p.status === "Closed").length;
  const totalCount = projects.length;
  const completionRate = totalCount > 0 ? ((closedCount / totalCount) * 100).toFixed(1) + "%" : "0%";

  const generateProjectId = (registrationNumber: string, projects: Project[]): string => {
    const normalized = registrationNumber.replace(/\s+/g, "").toUpperCase();
    const match = normalized.match(/[A-Z]+\d+/);
    const prefix = match ? match[0] : normalized.slice(0, 6);
    const count = projects.filter((p) => p.id.startsWith(prefix)).length + 1;
    const sequence = count.toString().padStart(3, "0");
    return `${prefix}-${sequence}`;
  };

  const handleCreateProject = async (newProject: NewProject): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      if (!merchantCode) {
        toast.error("Cannot create project: Merchant code not available");
        reject(new Error("Merchant code not available"));
        return;
      }
      
      try {
        const projectId = generateProjectId(newProject.registrationNumber, projects);
        const project: Project = {
          id: projectId,
          registrationNumber: newProject.registrationNumber,
          vehicleType: newProject.vehicleType,
          typeOfWork: newProject.typeOfWork,
          location: newProject.location,
          dateOpened: new Date().toISOString().split("T")[0],
          status: "Open",
          odometerReading: newProject.odometerReading,
        };

        // Store in the proper collection for the merchant
        const projectRef = doc(db, "merchants", merchantCode, "projects", projectId);
        await setDoc(projectRef, project);
        
        // Update local state immediately
        setProjects(prev => [...prev, project]);
        
        // Signal completion
        resolve();
      } catch (error) {
        console.error("Error creating project:", error);
        reject(error);
      }
    });
  };

  // Create stats array for the grid
  const stats = [
    {
      title: "Open Projects",
      value: openCount.toString(),
      insight: "Currently active projects",
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      title: "Closed Projects",
      value: closedCount.toString(),
      insight: "Projects completed",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "Total Projects",
      value: totalCount.toString(),
      insight: "Overall projects",
      icon: <Target className="h-5 w-5" />,
    },
    {
      title: "Completion Rate",
      value: completionRate,
      insight: "Closed vs Total",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen">
      <main>
        <div className="flex flex-col space-y-2 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">
                  <HomeIcon size={16} aria-hidden="true" />
                  <span className="sr-only">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Separator />
        
        <div className="flex justify-between mt-6">
        <h2 className="text-2xl font-bold">
        Project Stats
      </h2>
      <div className="">
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="mb-4">
            Create New Project
          </Button>

        </div>
        </div>
        
        {/* Display project stats */}
        <div className="mb-2">
          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2">Loading project stats...</p>
            </div>
          ) : (
            <StatsGrid stats={stats} />
          )}
        </div>

        <Separator className="mt-6" />

        {/* Project History Table */}
        <div className="mt-6">
          <ProjectHistoryTable 
            projects={projects}
            isLoading={loadingProjects}
            onRefresh={loadProjects}
          />
        </div>
 
        <Separator className="mt-6" />

        {/* Analytics Section */}
        <div className="mt-6">
          <AnalyticsSection merchantCode={merchantCode || ''} />
        </div>

        {/* When the modal is open, render it */}
        {isModalOpen && (
          <CreateProjectModal
            onCreate={handleCreateProject}
            onClose={() => {
              setIsModalOpen(false);
              // Refresh projects after modal closes
              loadProjects();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;