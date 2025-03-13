"use client"
import { LoginForm } from "../components/login/login-form";
import { useEffect } from "react"
 import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context";

 
export default function LoginPage() {

  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push("/dashboard")
  }, [user, router])

  if (loading) return <p>Loading...</p>
  
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
