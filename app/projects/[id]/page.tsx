"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectDetailForm, { ProjectDetail } from "@/app/components/project/project-details-form";
import { doc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase-config"; 
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { fetchProjectForMerchant } from "@/lib/fetch-projects";

const ProjectDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProjectData = async () => {
      try {
        // Fetch user's merchant code
        const userDoc = await getDocs(collection(db, "users"));
        const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();

        if (!userData || !userData.merchantCode) {
          console.error("Merchant code not found for user");
          setLoading(false);
          return;
        }

        setMerchantCode(userData.merchantCode);

        // Fetch project details for the merchant
        const fetchedProject = await fetchProjectForMerchant(userData.merchantCode, projectId);
        setProject(fetchedProject);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [user, projectId]);

  const handleSave = async (updatedProject: ProjectDetail) => {
    if (!merchantCode) return;
    try {
      const projectRef = doc(db, "merchants", merchantCode, "projects", projectId);
      await updateDoc(projectRef, { ...updatedProject });
      setProject(updatedProject);
      console.log("Project saved:", updatedProject);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return <div className="min-h-screen p-6">Project not found.</div>;
  }

  return (
    <div className="min-h-screen">
      <ProjectDetailForm project={project} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};

export default ProjectDetailPage;
