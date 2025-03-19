"use client";

import React, { useState, useEffect } from "react";
import { fetchDocumentsForProject } from "@/lib/project-documents";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { useAuth } from "@/context/auth-context";
import type { Project } from "@/types/project";

// This component will fetch document data for a project card
export const ProjectCardProgress: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documentProgress, setDocumentProgress] = useState({
    percentage: 0,
    completedSteps: 0,
    totalSteps: 8
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
        
        // Calculate progress
        setDocumentProgress(calculateDocumentProgress(docTypes));
      } catch (err) {
        console.error("Error fetching document types:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, [user, projectId]);

  const calculateDocumentProgress = (docTypes: string[]) => {
    // Document order that contributes to progress
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
    
    // Count how many document types in the expected order are present
    let completedSteps = 0;
    
    for (const docType of documentOrder) {
      if (docTypes.includes(docType)) {
        completedSteps++;
      }
    }
    
    // Calculate percentage
    const progressPercentage = (completedSteps / documentOrder.length) * 100;
    
    return {
      percentage: progressPercentage,
      completedSteps,
      totalSteps: documentOrder.length
    };
  };

  if (loading) {
    return (
      <div className="mt-4 w-full">
        <div className="bg-muted rounded-full h-1.5"></div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Document progress: ...</span>
          <span>...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full">
      <div className="bg-muted rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${documentProgress.percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Document progress: {documentProgress.completedSteps}/{documentProgress.totalSteps}</span>
        <span>{Math.round(documentProgress.percentage)}%</span>
      </div>
    </div>
  );
};
 