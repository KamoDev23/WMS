"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard") // Redirect authenticated users
    }
  }, [user, loading, router])

  if (loading) return null // Prevent hydration error
  return null
}
