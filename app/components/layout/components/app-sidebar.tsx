"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  User,
  Users,
  Receipt,
  Settings,
} from "lucide-react"
 
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"

// Updated navigation data with dashboard, projects, and business categories
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: LayoutDashboard,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: FolderKanban,
      plan: "Startup",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderKanban,
    },
    {
      title: "Business",
      url: "/business",
      icon: Briefcase,
      items: [
        {
          title: "Profile",
          url: "/business/profile",
        },
        {
          title: "Employee Management",
          url: "/business/employee-management",
        },
        {
          title: "Accounting",
          url: "/business/accounting",
        },
        {
          title: "Settings",
          url: "/business/settings",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Active Projects",
      url: "/projects/active",
      icon: FolderKanban,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher  />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
       
      <SidebarRail />
    </Sidebar>
  )
}