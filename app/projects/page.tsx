"use client";
import React, { useState, useEffect } from "react";
import CreateProjectModal, {
  NewProject,
} from "../components/project/create-project-modal";
import ProjectsList, { Project } from "../components/project/project-list";
import { Button } from "@/components/ui/button";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { ModeToggle } from "../components/theme/mode-toggle";

const ProjectsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch projects from Firestore on mount.
  useEffect(() => {
    async function fetchProjects() {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const fetchedProjects: Project[] = [];
        querySnapshot.forEach((docSnap) => {
          // Assume Firestore document data matches the Project type (except id)
          const data = docSnap.data() as Omit<Project, "id">;
          fetchedProjects.push({ id: docSnap.id, ...data });
        });
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
    fetchProjects();
  }, []);

  const handleCreateProject = async (newProject: NewProject) => {
    // Generate a new project ID based on the registration number.
    // For example, if registration is "GKJ494FS", generate "GKJ494-001"
    const prefix = newProject.registrationNumber.slice(0, 6).toUpperCase();
    const count = projects.filter((p) => p.id.startsWith(prefix)).length + 1;
    const sequence = count.toString().padStart(3, "0");
    const projectId = `${prefix}-${sequence}`;
    const project: Project = {
      id: projectId,
      registrationNumber: newProject.registrationNumber,
      vehicleType: newProject.vehicleType,
      typeOfWork: newProject.typeOfWork, // default placeholder
      location: newProject.location,
      date: new Date().toISOString().split("T")[0], // current date in YYYY-MM-DD
    };

    try {
      // Save the new project to Firestore with the custom document ID.
      await setDoc(doc(db, "projects", projectId), project);
      // Update local state.
      setProjects((prev) => [...prev, project]);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <div className="min-h-screen  p-6">
      <h1 className="text-3xl font-bold mb-4">Projects Dashboard</h1>
      <Button onClick={() => setIsModalOpen(true)} className="mb-4">
        Create New Project
      </Button>

      <ProjectsList projects={projects} />
      {isModalOpen && (
        <CreateProjectModal
          onCreate={handleCreateProject}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
