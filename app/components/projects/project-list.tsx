"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ProjectsCarouselView from "./tables/projects-carousel-view";
import ProjectsTable from "./tables/projects-table";
import { Loader2, RefreshCw } from "lucide-react";
import { fetchProjectsForMerchant } from "@/lib/fetch-projects";
import { Project } from "@/types/project";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase/firebase-config";
import { getDocs, collection } from "firebase/firestore";

interface ProjectsListPageProps {
  projects?: Project[];
  isLoading?: boolean;
  onRefresh?: () => void;
  merchantCode?: string | null;
}

export default function ProjectsListPage({
  projects: externalProjects,
  isLoading: externalLoading,
  onRefresh: externalRefresh,
  merchantCode: externalMerchantCode
}: ProjectsListPageProps) {
  const { user } = useAuth();
  const [internalProjects, setInternalProjects] = useState<Project[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"table" | "carousel">("table");
  const [internalMerchantCode, setInternalMerchantCode] = useState<string | null>(null);

  // Determine if we're using external or internal data sources
  const isExternalData = externalProjects !== undefined;
  const projects = isExternalData ? externalProjects : internalProjects;
  const loading = isExternalData ? (externalLoading || false) : internalLoading;
  const merchantCode = isExternalData ? externalMerchantCode : internalMerchantCode;

  // Handle internal data fetching if no external data is provided
  useEffect(() => {
    // Skip if we're using external data or if no user is logged in
    if (isExternalData || !user) return;

    const fetchMerchantProjects = async () => {
      try {
        setInternalLoading(true);
        // Fetch user's merchant code
        const userDoc = await getDocs(collection(db, "users"));
        const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();
        if (!userData || !userData.merchantCode) {
          console.error("Merchant code not found for user");
          setInternalLoading(false);
          return;
        }
        setInternalMerchantCode(userData.merchantCode);
        // Fetch projects linked to this merchant
        const fetchedProjects = await fetchProjectsForMerchant(userData.merchantCode);
        setInternalProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setInternalLoading(false);
      }
    };

    fetchMerchantProjects();
  }, [user, isExternalData]);

  // Function to refresh projects
  const handleRefresh = async () => {
    if (externalRefresh) {
      // Use external refresh function if provided
      externalRefresh();
    } else if (internalMerchantCode) {
      // Otherwise handle internally
      try {
        setInternalLoading(true);
        const fetchedProjects = await fetchProjectsForMerchant(internalMerchantCode);
        setInternalProjects(fetchedProjects);
      } catch (error) {
        console.error("Error refreshing projects:", error);
      } finally {
        setInternalLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="  items-center mb-4">
         
      <div className="flex justify-end px-2">
        <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            </div>
        <ProjectsTable projects={projects} merchantCode={merchantCode} onRefresh={handleRefresh}/>
      </div>
    </div>
  );
}