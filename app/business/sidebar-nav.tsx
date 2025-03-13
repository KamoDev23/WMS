// app/business/sidebar-nav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // or your own classnames utility

const navItems = [
  { title: "Profile", href: "/business/profile" },
  { title: "Employee Management", href: "/business/employee-management" },
  { title: "Accounting", href: "/business/accounting" },
  { title: "Settings", href: "/business/settings" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-6"> 
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-foreground"
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
