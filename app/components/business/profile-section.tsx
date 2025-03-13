"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

export interface ProfileData {
  companyName: string;
  address: string;
  beeCertification: string;
  taxClearance: string;
  phoneNumber: string;
}

const ProfileSection: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const docRef = doc(db, "businessProfile", "default");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as ProfileData);
        } else {
          console.log("No profile found. Initializing new profile.");
          setProfile({
            companyName: "",
            address: "",
            beeCertification: "",
            taxClearance: "",
            phoneNumber: "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (profile) {
      setProfile((prev) => ({ ...prev!, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "businessProfile", "default");
      await updateDoc(docRef, { ...profile });
      console.log("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 p-4  "
    >
      <div>
        <Label htmlFor="companyName" className="block text-sm font-medium">
          Company Name
        </Label>
        <Input
          id="companyName"
          type="text"
          name="companyName"
          value={profile?.companyName || ""}
          onChange={handleChange}
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <Label htmlFor="address" className="block text-sm font-medium">
          Address
        </Label>
        <Input
          id="address"
          type="text"
          name="address"
          value={profile?.address || ""}
          onChange={handleChange}
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <Label htmlFor="beeCertification" className="block text-sm font-medium">
          BEE Certification
        </Label>
        <Input
          id="beeCertification"
          type="text"
          name="beeCertification"
          value={profile?.beeCertification || ""}
          onChange={handleChange}
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <Label htmlFor="taxClearance" className="block text-sm font-medium">
          Tax Clearance
        </Label>
        <Input
          id="taxClearance"
          type="text"
          name="taxClearance"
          value={profile?.taxClearance || ""}
          onChange={handleChange}
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <Label htmlFor="phoneNumber" className="block text-sm font-medium">
          Phone Number
        </Label>
        <Input
          id="phoneNumber"
          type="text"
          name="phoneNumber"
          value={profile?.phoneNumber || ""}
          onChange={handleChange}
          className="mt-1 block w-full"
        />
      </div>
      <Button
        type="submit"
        className="px-4 py-2  d"
      >
        Save Profile
      </Button>
    </form>
  );
};

export default ProfileSection;
