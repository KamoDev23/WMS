// fetchProjects.ts
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import type { Project } from "@/types/project";
import { ProjectDetail } from "@/app/components/project/project-details-form";

export async function fetchProjects(): Promise<Project[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<Project, "id">;
      projects.push({ id: doc.id, ...data });
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export const fetchProjectsForMerchant = async (merchantCode: string): Promise<Project[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "merchants", merchantCode, "projects"));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};

export const fetchProjectForMerchant = async (merchantCode: string, projectId: string): Promise<ProjectDetail | null> => {
  try {
    const projectRef = doc(db, "merchants", merchantCode, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      return projectSnap.data() as ProjectDetail;
    } else {
      console.error("No such project exists!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
};

