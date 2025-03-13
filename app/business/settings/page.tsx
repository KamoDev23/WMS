"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit, CircleX, Loader2, Mail, Tag, User } from "lucide-react";
import { toast } from "sonner";
import { db, storage } from "@/firebase/firebase-config";
import { query, collection, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { ThemeSelector } from "@/app/components/theme/theme-selector";
import AccountingDocumentsManager from "@/app/components/business/accounting/accounting-documents-manager";
import { useTheme } from "next-themes";
import CompanyDocumentsManager from "@/app/components/business/accounting/company-documents-manager";
import EmployeeDocumentsManager from "@/app/components/business/accounting/employee-documents-manager";
import EmployeeManagementPage from "../employee-management/page";

export default function SettingsPage() {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [appSettings, setAppSettings] = useState({
    autoSave: true,
    notifications: true,
  });
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("en");
  
  // NEW: Profile picture states
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    merchantCode: string;
    role: string;
    createdAt: string;
    profilePicUrl?: string;
  }

  // Fetch user details from Firebase Auth/Firestore
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setUserDetails(userSnap.data() as User);
          } else {
            console.error("User document does not exist");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch connected users based on merchantCode
  useEffect(() => {
    const fetchConnectedUsers = async () => {
      if (!userDetails?.merchantCode) return;
      try {
        const q = query(
          collection(db, "users"),
          where("merchantCode", "==", userDetails.merchantCode)
        );
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email,
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          merchantCode: doc.data().merchantCode,
          role: doc.data().role,
          createdAt: doc.data().createdAt,
          profilePicUrl: doc.data().profilePicUrl,
        }));
        setConnectedUsers(users);
      } catch (error) {
        console.error("Error fetching connected users:", error);
      }
    };
    fetchConnectedUsers();
  }, [userDetails?.merchantCode]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditUserDetails = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Optionally revert changes if needed
  };

  const handleSaveUserDetails = () => {
    setIsEditing(false);
    toast.success("User details saved!");
    // Add Firestore update logic as needed
  };

  // --- Profile Picture Handlers ---
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicFile(e.target.files[0]);
    }
  };

  const handleProfilePicUpload = async () => {
    if (!profilePicFile || !userDetails) return;
    setUploadingProfilePic(true);
    try {
      // Use user.uid for storage path. Ensure userDetails has uid or fallback to auth user.uid.
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid;
      if (!uid) throw new Error("User ID not found");
      const storageRef = ref(storage, `profile-pictures/${uid}`);
      const snapshot = await uploadBytes(storageRef, profilePicFile);
      const url = await getDownloadURL(snapshot.ref);
      // Update user document with new profilePicUrl
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { profilePicUrl: url });
      setUserDetails({ ...userDetails, profilePicUrl: url });
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error uploading profile picture", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingProfilePic(false);
      setProfilePicFile(null);
    }
  };

  if (loading)
    return (
      <div className="mt-20 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!userDetails)
    return <div>No user details found. Please log in.</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Add, remove, or edit your employees' details.
        </p>
      </div>

      {/* User Details Section */}
      <Card className="p-6">
        <CardHeader>
          <div className="flex justify-between">
            <h2 className="text-xl font-bold mb-2">User Details</h2>
            <div className="col-span-1 flex justify-end">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={handleSaveUserDetails}>Save</Button>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    <CircleX size={16} />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={handleEditUserDetails}>
                  <Edit size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-4">
            {/* Column 1: Header and description */}
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">
                Update your personal details below.
              </p>
            </div>

            {/* Column 2: Input fields in a two-column grid */}
            <div className="col-span-6 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="block text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userDetails.firstName || ""}
                  onChange={handleUserChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="block text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={userDetails.lastName || ""}
                  onChange={handleUserChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  value={userDetails.email || ""}
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium">Merchant Code</Label>
                <Input value={userDetails.merchantCode || ""} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="block text-sm font-medium">Role</Label>
                <Input value={userDetails.role || ""} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="block text-sm font-medium">Account Created</Label>
                <Input
                  value={new Date(userDetails.createdAt).toLocaleString()}
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>

            {/* Column 3: Profile picture upload */}
            <div className="col-span-2 flex flex-col items-center">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={
                    userDetails.profilePicUrl ||
                    "https://www.svgrepo.com/show/384670/account-avatar-profile-user.svg"
                  }
                  alt="Profile Picture"
                />
                <AvatarFallback>
                  {userDetails.firstName ? userDetails.firstName[0] : "U"}
                </AvatarFallback>
              </Avatar>
              <label className="mt-4 cursor-pointer">
                <Input
                  type="file"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
                <Button
                  size="sm"
                  disabled={uploadingProfilePic || !profilePicFile}
                  onClick={handleProfilePicUpload}
                >
                  {uploadingProfilePic ? "Uploading..." : "Upload New Picture"}
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Connected Users Section */}
      <Card className="p-6">
        <CardHeader>
          <h2 className="text-xl font-bold mb-2">Connected Users</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">
                View the list of users connected to your account.
              </p>
            </div>
            <div className="col-span-9">
              {connectedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connected users.</p>
              ) : (
                <ul className="space-y-4">
                  {connectedUsers.map((user) => (
                    <li key={user.id} className="flex">
                      <Card className="w-full p-8">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <div className="flex gap-4 items-center">
                              <Avatar className="w-16 h-16">
                                <AvatarImage
                                  src={
                                    user.profilePicUrl ||
                                    "https://github.com/shadcn.png"
                                  }
                                  alt={`${user.firstName} ${user.lastName}`}
                                />
                                <AvatarFallback>
                                  {user.firstName ? user.firstName[0] : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {user.role}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 px-6 mt-4 font-bold">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                    <User size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium">Name</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {user.firstName} {user.lastName}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                    <Mail size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium">Email</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {user.email}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                    <Tag size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium">Role</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {user.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Button size="sm" variant="destructive">
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Personalisation Section */}
      <Card className="p-6">
        <CardHeader>
          <h2 className="text-xl font-bold mb-2">Personalisation</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">
                Select your theme.
              </p>
            </div>
            <div className="col-span-9 mt-2 mb-4">
              <ThemeSelector />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Documentation Section */}
      <Card className="p-6">
        <CardHeader>
          <h2 className="text-xl font-bold mb-2">Documentation</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">
                Add documentation options.
              </p>
            </div>
            <div className="col-span-9 space-y-8">
              <CompanyDocumentsManager merchantCode={userDetails.merchantCode} />
              <EmployeeDocumentsManager merchantCode={userDetails.merchantCode} />
              <AccountingDocumentsManager merchantCode={userDetails.merchantCode} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Application Settings Section */}
      {/* <Card className="p-6">
        <CardHeader>
          <h2 className="text-xl font-bold mb-2">Application Settings</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">
                Change application settings.
              </p>
            </div>
            <div className="col-span-9 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between mr-10">
                  <Label className="block text-sm font-bold mr-4">
                    Auto-save Documents
                  </Label>
                  <div>
                    <input
                      type="checkbox"
                      checked={appSettings.autoSave}
                      onChange={(e) =>
                        setAppSettings((prev) => ({
                          ...prev,
                          autoSave: e.target.checked,
                        }))
                      }
                    />
                    <span className="ml-2 text-sm">
                      {appSettings.autoSave ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mr-10">
                  <Label className="block text-sm font-bold mr-4">
                    Enable Notifications
                  </Label>
                  <div>
                    <input
                      type="checkbox"
                      checked={appSettings.notifications}
                      onChange={(e) =>
                        setAppSettings((prev) => ({
                          ...prev,
                          notifications: e.target.checked,
                        }))
                      }
                    />
                    <span className="ml-2 text-sm">
                      {appSettings.notifications ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}

 