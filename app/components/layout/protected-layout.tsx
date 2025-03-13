"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import GlobalHeader from "./global-header"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login") // Redirect unauthenticated users
    }
  }, [user, loading, router])

  if (loading) return null // Prevent flickering while checking authentication

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {user && <AppSidebar />}

        <div className="flex flex-col flex-1 w-full">
          {user && (
            // Sticky header with a blurred backdrop and a translucent background
            <div className="sticky top-0 z-50 backdrop-blur-md ">
              <GlobalHeader />
            </div>
          )}
          <SidebarInset>
            <div className="p-6 w-full">{children}</div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
