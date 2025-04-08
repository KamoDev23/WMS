"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit, CircleX, Loader2, Mail, Tag, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { db, storage } from "@/firebase/firebase-config";
import { query, collection, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { ThemeSelector } from "@/app/components/theme/theme-selector";
 import { useTheme } from "next-themes"; 
import { ClientDialog } from "@/app/components/business/settings/client-dialog";
import DeleteConfirmationDialog from "@/app/components/customs/delete-confirmation-dialog";

export default function SettingsPage() {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [originalUserDetails, setOriginalUserDetails] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savingUserDetails, setSavingUserDetails] = useState(false);
  const [disconnectingUser, setDisconnectingUser] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
 
  // Profile picture states
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);


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

  interface Client {
    id: string;
    contactPerson: string;
    clientName: string;
    address: string;
    vat: string;
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
            const userData = { id: user.uid, ...userSnap.data() } as User;
            setUserDetails(userData);
            setOriginalUserDetails(userData); // Save original data for cancel operation
          } else {
            console.error("User document does not exist");
            toast.error("User profile not found");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          toast.error("Failed to load user profile");
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
        toast.error("Failed to load connected users");
      }
    };
    fetchConnectedUsers();
  }, [userDetails?.merchantCode]);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!userDetails?.merchantCode) return;
  
      try {
        const merchantDoc = await getDoc(doc(db, "merchants", userDetails.merchantCode));
        if (merchantDoc.exists()) {
          const data = merchantDoc.data();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      }
    };
  
    fetchClients();
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
    // Revert changes by restoring the original data
    if (originalUserDetails) {
      setUserDetails(originalUserDetails);
    }
  };

  const handleSaveUserDetails = async () => {
    if (!userDetails) return;
    
    setSavingUserDetails(true);
    try {
      // Save user details to Firestore
      const userDocRef = doc(db, "users", userDetails.id);
      await updateDoc(userDocRef, {
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        // Only update fields that are editable
      });
      
      // Update the original user details
      setOriginalUserDetails(userDetails);
      toast.success("User details saved successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user details:", error);
      toast.error("Failed to save user details");
    } finally {
      setSavingUserDetails(false);
    }
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
      // Use user.uid for storage path
      const storageRef = ref(storage, `profile-pictures/${userDetails.id}`);
      const snapshot = await uploadBytes(storageRef, profilePicFile);
      const url = await getDownloadURL(snapshot.ref);
      
      // Update user document with new profilePicUrl
      const userDocRef = doc(db, "users", userDetails.id);
      await updateDoc(userDocRef, { profilePicUrl: url });
      
      // Update local state
      setUserDetails({ ...userDetails, profilePicUrl: url });
      setOriginalUserDetails({ ...userDetails, profilePicUrl: url });
      
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error uploading profile picture", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingProfilePic(false);
      setProfilePicFile(null);
    }
  };

  const handleDisconnectUser = async (userId: string) => {
    if (!userDetails || !userId) return;
    
    setDisconnectingUser(userId);
    try {
      // Here we would implement the logic to disconnect a user
      // For now, we'll just show a mock success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate server request
      
      // Update UI to reflect the change
      setConnectedUsers(prev => prev.filter(user => user.id !== userId));
      
      toast.success("User disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting user:", error);
      toast.error("Failed to disconnect user");
    } finally {
      setDisconnectingUser(null);
    }
  };

  const handleSaveClient = async (client: Client) => {
    if (!userDetails?.merchantCode) return;
  
    setSavingClient(true);
    const updatedClients = (() => {
      const exists = clients.find((c) => c.id === client.id);
      if (exists) {
        return clients.map((c) => (c.id === client.id ? client : c));
      } else {
        return [...clients, client];
      }
    })();
  
    try {
      const merchantDocRef = doc(db, "merchants", userDetails.merchantCode);
      await updateDoc(merchantDocRef, {
        clients: updatedClients,
      });
  
      setClients(updatedClients);
      setSavingClient(false);
      toast.success(`Client ${client.clientName} saved`);
      
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Failed to save client");
    } finally {
     
      setDialogOpen(false); // Close manually from parent
    }
  };  

  const confirmDeleteClient = async () => {
    if (!userDetails?.merchantCode || !clientToDelete) return;
  
    setIsDeletingClient(true);
    const updated = clients.filter((c) => c.id !== clientToDelete.id);
  
    try {
      const merchantDocRef = doc(db, "merchants", userDetails.merchantCode);
      await updateDoc(merchantDocRef, { clients: updated });
  
      setClients(updated);
      toast.success(`Client "${clientToDelete.clientName}" removed`);
    } catch (error) {
      console.error("Error removing client:", error);
      toast.error("Failed to remove client");
    } finally {
      setIsDeletingClient(false);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
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
          Manage your account, connected users, and application preferences.
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
                  <Button 
                    onClick={handleSaveUserDetails}
                    disabled={savingUserDetails}
                  >
                    {savingUserDetails ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={savingUserDetails}
                  >
                    <CircleX size={16} className="mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={handleEditUserDetails}>
                  <Edit size={16} className="mr-2" />
                  Edit
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
                  disabled={!isEditing || savingUserDetails}
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
                  disabled={!isEditing || savingUserDetails}
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
            <div className="col-span-3 flex flex-col items-center">
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
              <div className="mt-4 flex flex-col gap-2 items-center">
                <label className="cursor-pointer">
                  <Input
                    id="profilePicInput"
                    type="file"
                    className="hidden"
                    onChange={handleProfilePicChange}
                    accept="image/*"
                    disabled={uploadingProfilePic}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('profilePicInput')?.click()}
                   >
                    Choose File
                  </Button>
                </label>
                {profilePicFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {profilePicFile.name}
                  </p>
                )}
                <Button
                  size="sm"
                  disabled={uploadingProfilePic || !profilePicFile}
                  onClick={handleProfilePicUpload}
                  className="w-full"
                >
                  {uploadingProfilePic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Picture"
                  )}
                </Button>
              </div>
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
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDisconnectUser(user.id)}
                              disabled={disconnectingUser === user.id || user.id === userDetails.id}
                            >
                              {disconnectingUser === user.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Disconnecting...
                                </>
                              ) : (
                                "Disconnect"
                              )}
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

      {/* Documentation Section */}
            <Card className="p-6">
              <CardHeader>
                <h2 className="text-xl font-bold mb-2">Client Management</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-11 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Manage your clients.
                    </p>
                  </div>
                  <div className="col-span-9 space-y-8">
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => { setEditClient(null); setDialogOpen(true); }}>
                      + Add Client
                    </Button>
                  </div>

                  <ul className="space-y-4">
                    {clients.map((client) => (
                      <Card key={client.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{client.clientName}</p>
                            <p className="text-sm text-muted-foreground">Contact: {client.contactPerson}</p>
                            <p className="text-sm text-muted-foreground">Address: {client.address}</p>
                            <p className="text-sm text-muted-foreground">VAT: {client.vat}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditClient(client); setDialogOpen(true); }}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setClientToDelete(client);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              Remove
                            </Button>

                          </div>
                        </div>
                      </Card>
                    ))}
                  </ul>

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

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveClient}
        client={editClient}
        isSaving={savingClient}
      />


      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        documentName={clientToDelete?.clientName || ""}
        onConfirm={confirmDeleteClient}
        isDeleting={isDeletingClient}
      />

    </div>
  );
}


