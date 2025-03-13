"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "../theme/mode-toggle";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { NavUser } from "./components/nav-user";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalHeader() {
  const { user, logout, loading, userData } = useAuth();

  // When loading or if userData is not available, render a skeleton header.
  if (loading || !userData) {
    return (
      <header className="flex items-center justify-between px-4 py-2 border-b w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
          <ModeToggle />
           
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b w-full">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      <div className="flex items-center space-x-4">
        <NavUser
          user={{
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email || "unknown@example.com",
            profilePicUrl : userData.profilePicUrl  || "/default-avatar.png",
          }}
        />
        <ModeToggle />
         
      </div>
    </header>
  );
}
