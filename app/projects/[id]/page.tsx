"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectDetailForm, {
  ProjectDetail,
} from "@/app/components/project/project-details-form";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

const ProjectDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project details from Firestore when component mounts.
  useEffect(() => {
    async function fetchProject() {
      try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject(docSnap.data() as ProjectDetail);
        } else {
          console.error("No such project exists!");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  // Save changes to Firestore
  const handleSave = async (updatedProject: ProjectDetail) => {
    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, { ...updatedProject });
      setProject(updatedProject);
      console.log("Project saved:", updatedProject);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  // Submit changes (could include additional business logic)
  const handleSubmit = async (updatedProject: ProjectDetail) => {
    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, { ...updatedProject });
      setProject(updatedProject);
      console.log("Project submitted:", updatedProject);
      // Optionally, navigate away or show a success message.
    } catch (error) {
      console.error("Error submitting project:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return <div className="min-h-screen   p-6">Loading project details...</div>;
  }

  // If no project is found, you might want to display an error message.
  if (!project) {
    return <div className="min-h-screen   p-6">Project not found.</div>;
  }

  return (
    <div className="min-h-screen  p-6">
      <ProjectDetailForm
        project={project}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ProjectDetailPage;
