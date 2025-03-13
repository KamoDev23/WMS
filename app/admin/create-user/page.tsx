"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/firebase-config"
import { db } from "@/firebase/firebase-config"
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function CreateUserPage() {
  const router = useRouter()
  const [accessGranted, setAccessGranted] = useState(false)
  const [enteredPassword, setEnteredPassword] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [merchantCode, setMerchantCode] = useState("")
  const [companyName, setCompanyName] = useState("")
   const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<"Admin Tier 1" | "Admin Tier 2" | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const secretPassword = process.env.NEXT_PUBLIC_SUPERADMIN_PASSWORD

  const handleAccess = () => {
    if (enteredPassword === secretPassword) {
      setAccessGranted(true)
    } else {
      setError("Incorrect secret password.")
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!role) {
      setError("Please select a role.")
      setLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid

      // Create or update merchant document
      const merchantRef = doc(db, "merchants", merchantCode)
      const merchantSnap = await getDoc(merchantRef)

      if (merchantSnap.exists()) {
        // If merchant exists, add the new user to the users array
        await updateDoc(merchantRef, {
          users: arrayUnion({
            userId,
            email,
            firstName,
            lastName,
            role,
          }),
        })
      } else {
        // If merchant doesn't exist, create a new document
        await setDoc(merchantRef, {
          merchantCode,
          companyName,
           users: [
            {
              userId,
              email,
              firstName,
              lastName,
              role,
            },
          ],
          createdAt: new Date().toISOString(),
        })
      }

      // Store user data in Firestore
      await setDoc(doc(db, "users", userId), {
        email,
        firstName,
        lastName,
        merchantCode,
        role,
        createdAt: new Date().toISOString(),
      })

      setSuccess("User successfully created and linked to merchant!")
      setEmail("")
      setPassword("")
      setMerchantCode("")
      setCompanyName("")
      setFirstName("")
      setLastName("")
      setRole("")
    } catch (err: any) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "This email is already in use."
      case "auth/invalid-email":
        return "Invalid email format."
      case "auth/weak-password":
        return "Password should be at least 6 characters."
      default:
        return "Failed to create user. Please try again."
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {!accessGranted ? (
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold">Admin Access</h1>
          <Label htmlFor="secret">Enter Super Admin Password</Label>
          <Input
            id="secret"
            type="password"
            placeholder="Enter secret password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleAccess} className="w-full">
            Verify
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-xl font-bold">Create New User</h1>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select onValueChange={(value) => setRole(value as "Admin Tier 1" | "Admin Tier 2")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin Tier 1">Admin Tier 1</SelectItem>
                  <SelectItem value="Admin Tier 2">Admin Tier 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <Label htmlFor="merchantCode">Merchant Code</Label>
              <Input
                id="merchantCode"
                type="text"
                placeholder="Enter merchant code"
                value={merchantCode}
                onChange={(e) => setMerchantCode(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div> 
           
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating user..." : "Create User"}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
