import { db } from "@/firebase/firebase-config"
import { doc, getDoc } from "firebase/firestore"

export async function fetchUserData(userId: string) {
  try {
    const userDocRef = doc(db, "users", userId)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      return userDoc.data() as { firstName: string; lastName: string; email: string; avatar?: string }
    } else {
      console.warn("User document not found for ID:", userId)
      return null
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}
