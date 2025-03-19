"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/firebase/firebase-config";
import { useRouter } from "next/navigation";
import { fetchUserData } from "@/lib/fetch-user";

interface UserData {
  uid: string;
  email: string | null;
  displayName?: string | null;
  firstName?: string;
  lastName?: string;
  merchantCode?: string;
  role?: string;
  profilePicUrl?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("AuthProvider: Attempting to rehydrate stored auth user.");
    const storedAuthUser = sessionStorage.getItem("authUser");
    if (storedAuthUser) {
      try {
        const parsedUser = JSON.parse(storedAuthUser);
        console.log("Rehydrated stored auth user:", parsedUser);
        setUser(parsedUser);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing stored auth user:", error);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed. Firebase user:", firebaseUser);
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const minimalUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        console.log("Storing minimal auth user in sessionStorage:", minimalUser);
        sessionStorage.setItem("authUser", JSON.stringify(minimalUser));

        const storedUserData = sessionStorage.getItem("authUserData");
        if (storedUserData) {
          console.log("Found stored user data:", JSON.parse(storedUserData));
          setUserData(JSON.parse(storedUserData));
        } else {
          console.log("No stored user data found. Fetching from Firestore...");
          fetchUserData(firebaseUser.uid)
            .then((data) => {
              if (data) {
                const completeUserData = { ...data, uid: firebaseUser.uid };
                console.log("Fetched user data:", completeUserData);
                setUserData(completeUserData);
                sessionStorage.setItem("authUserData", JSON.stringify(completeUserData));
              } else {
                console.warn("Fetched user data is empty.");
              }
            })
            .catch((error) => {
              console.error("Error fetching user data:", error);
            });
        }
      } else {
        console.log("No Firebase user. Clearing stored auth data and redirecting to login.");
        sessionStorage.removeItem("authUser");
        sessionStorage.removeItem("authUserData");
        router.push("/login");
      }
    });
    return () => {
      console.log("AuthProvider: Cleaning up auth state listener.");
      unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    console.log("Logging out user...");
    await signOut(auth);
    sessionStorage.removeItem("authUser");
    sessionStorage.removeItem("authUserData");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
