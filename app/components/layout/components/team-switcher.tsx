"use client";

import React, { useState, useEffect } from "react";
import { BicepsFlexed, ChevronRight, Pyramid } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { useAuth } from "@/context/auth-context";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function TeamSwitcher() {
  const { userData } = useAuth();
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    if (!userData?.merchantCode) return;
    const fetchCompanyName = async () => {
      try {
        const merchantDocRef = doc(db, "merchants", userData.merchantCode || "");
        const merchantSnap = await getDoc(merchantDocRef);
        if (merchantSnap.exists()) {
          const data = merchantSnap.data();
          setCompanyName(data.companyName || "Unknown Company");
        } else {
          setCompanyName("Unknown Company");
        }
      } catch (error) {
        console.error("Error fetching company name:", error);
        setCompanyName("Unknown Company");
      }
    };

    fetchCompanyName();
  }, [userData?.merchantCode]);

  if (!companyName) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <div className="flex aspect-square h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-gray-800">
            <Pyramid size={16} />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate font-semibold">Smart Line</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
