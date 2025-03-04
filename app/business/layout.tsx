// app/business/layout.tsx
import React from "react";
import SidebarNav from "./sidebar-nav";

export const metadata = {
  title: "Business Module",
  description: "Manage your company settings and resources.",
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Global Header spanning full width */}
      <header className="px-6 py-4    ">
        <h1 className="text-3xl font-bold mb-1">Business Module</h1>
        <p className="text-muted-foreground mb-2">
          Manage your business details and settings here.
        </p>
        <hr />
      </header>

      {/* Two-column layout: Sidebar and Main Content */}
      <div className="md:grid md:grid-cols-[440px_1fr]">
        <aside className="  hidden md:block  ">
          <SidebarNav />
        </aside>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
