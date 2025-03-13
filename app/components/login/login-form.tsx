"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"
import { auth } from "@/firebase/firebase-config"
import { GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FirebaseError } from "firebase/app"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Function to map Firebase errors to user-friendly messages
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Invalid email format. Please check and try again."
      case "auth/user-disabled":
        return "This account has been disabled. Contact support for assistance."
      case "auth/user-not-found":
        return "No account found with this email. Please check or sign up."
      case "auth/wrong-password":
        return "Incorrect password. Please try again."
      case "auth/too-many-requests":
        return "Too many failed attempts. Try again later."
      case "auth/network-request-failed":
        return "Network error. Check your internet connection."
      default:
        return "Login failed. Please try again later."
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard") // Redirect after successful login
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(getErrorMessage(err.code))
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleLogin}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">WMS</h1>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid gap-2 gap-y-4">
              <div>
                <Label className="mb-2" htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="flex mt-2 justify-end">
                  <a href="#" className="text-xs text-primary underline-offset-2 hover:underline">
                    Forgot Password?
                  </a>
                </div>
              </div>
            </div>

           
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
             {/* Display error messages */}
             {error && <p className="text-red-500 text-xs">{error}</p>}

          </div>
        </div>
      </form>
      <div className="text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
