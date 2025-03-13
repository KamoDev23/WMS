"use client";
import React, { useState, useEffect } from "react";
import CreateProjectModal, { NewProject } from "../components/project/create-project-modal";
import ProjectsListPage from "../components/project/project-list";
import { Button } from "@/components/ui/button";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { Project } from "@/types/project";
import { useAuth } from "@/context/auth-context";
import { fetchProjectsForMerchant } from "@/lib/fetch-projects";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
 
const ProjectsPage: React.FC = () => {
  const { user } = useAuth(); // Get the logged-in user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch projects when component mounts or when user changes
  useEffect(() => {
    if (!user) return;
    fetchMerchantProjects();
  }, [user]);

  // Function to fetch projects and merchant code from the user's document
  const fetchMerchantProjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get the current user's document directly using their UID
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.error("User document not found");
        setIsLoading(false);
        return;
      }
      const userData = userSnap.data();
      if (!userData || !userData.merchantCode) {
        console.error("Merchant code not found for user");
        setIsLoading(false);
        return;
      }
      setMerchantCode(userData.merchantCode);
      
      // Fetch projects from the new directory structure
      const fetchedProjects = await fetchProjectsForMerchant(userData.merchantCode);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a project ID based on the registration number and current projects
  const generateProjectId = (registrationNumber: string, projects: Project[]): string => {
    const normalized = registrationNumber.replace(/\s+/g, "").toUpperCase();
    const match = normalized.match(/[A-Z]+\d+/);
    const prefix = match ? match[0] : normalized.slice(0, 6);
    const count = projects.filter((p) => p.id.startsWith(prefix)).length + 1;
    const sequence = count.toString().padStart(3, "0");
    return `${prefix}-${sequence}`;
  };

  const handleCreateProject = async (newProject: NewProject) => {
    if (!merchantCode) {
      console.error("Merchant code not available, cannot create project.");
      return;
    }
    
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
    
    try {
      const projectRef = doc(db, "merchants", merchantCode, "projects", projectId);
      await setDoc(projectRef, project);
      
      // Update local state immediately
      setProjects((prev) => [...prev, project]);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col space-y-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <HomeIcon size={16} aria-hidden="true" />
                <span className="sr-only">Home</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Separator className="mb-6" />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Projects List</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          Create New Project
        </Button>
      </div>
      
      {/* Render the projects list */}
      <ProjectsListPage 
        projects={projects}
        isLoading={isLoading}
        onRefresh={fetchMerchantProjects}
        merchantCode={merchantCode}
      />
     
      {isModalOpen && (
        <CreateProjectModal
          onCreate={handleCreateProject}
          onClose={() => {
            setIsModalOpen(false);
            fetchMerchantProjects(); // Refresh projects when modal closes
          }}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
