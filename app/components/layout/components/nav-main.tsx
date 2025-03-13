"use client";
import React from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Checks if an item or any of its subitems is active based on the current pathname
  const isItemActive = (item: { url: string; items?: { url: string }[] }) => {
    if (pathname === item.url) return true;
    if (pathname.startsWith(item.url) && item.url !== "/") return true;
    if (item.items?.some((subItem) => pathname === subItem.url)) return true;
    return false;
  };

  // Checks if a specific subitem is active
  const isSubItemActive = (url: string) => pathname === url;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Home</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const active = isItemActive(item);

          // For items with sub-items, render a collapsible menu
          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={active || item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      data-active={active}
                      onClick={() => {
                        // When clicking the trigger, we want to expand/collapse.
                        // Note: router.push can be called from a subitem instead.
                      }}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const subActive = isSubItemActive(subItem.url);
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              data-active={subActive}
                              onClick={() => router.push(subItem.url)}
                            >
                              <button className="w-full text-left">
                                <span>{subItem.title}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // For regular items, render a button that uses router.push
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                data-active={active}
                onClick={() => router.push(item.url)}
              >
                <button className="flex items-center w-full">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
