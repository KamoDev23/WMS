import { db, storage } from "@/firebase/firebase-config";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface ProfileData {
  companyName: string;
  address: string;
  companyEmail?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  companyLogo?: string;
  tagline?: string;
}

interface ProfileDocument {
  id: string;
  type: "BEE Document" | "Tax Certification" | "Insurance Document" | "Other";
  fileName: string;
  url: string;
}

/**
 * Fetches profile data from Firestore.
 */
export const fetchProfileData = async (merchantCode: string): Promise<ProfileData | null> => {
    try {
      const merchantRef = doc(db, "merchants", merchantCode); // Fetch directly from the merchant document
      const merchantSnap = await getDoc(merchantRef);
  
      if (merchantSnap.exists()) {
        console.log("Merchant profile found.");
        return merchantSnap.data() as ProfileData;
      } else {
        console.error("Merchant profile not found.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      return null;
    }
  };

/**
 * Saves or updates profile data in Firestore.
 */
export const saveProfileData = async (merchantCode: string, profileData: ProfileData) => {
    try {
      const merchantRef = doc(db, "merchants", merchantCode);
      
      await setDoc(merchantRef, profileData, { merge: true }); //  Ensures existing data is updated
  
      console.log("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

/**
 * Fetches documents for the merchant from Firestore.
 */
export const fetchProfileDocuments = async (merchantCode: string): Promise<ProfileDocument[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "merchants", merchantCode, "documents"));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProfileDocument));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

/**
 * Uploads a document to Firebase Storage and saves metadata to Firestore.
 */
export const uploadProfileDocument = async (
  merchantCode: string,
  file: File,
  docType: string
): Promise<ProfileDocument | null> => {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${docType}.${fileExt}`;
    const storageRef = ref(storage, `merchants/${merchantCode}/documents/${fileName}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata in Firestore
    const docRef = doc(collection(db, "merchants", merchantCode, "documents"));
    const docData: ProfileDocument = {
      id: docRef.id,
      type: docType as ProfileDocument["type"],
      fileName,
      url: downloadURL,
    };

    await setDoc(docRef, docData);
    return docData;
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
};

/**
 * Deletes a document from Firestore and Firebase Storage.
 */
export const deleteProfileDocument = async (merchantCode: string, docId: string, fileName: string) => {
  try {
    const storageRef = ref(storage, `merchants/${merchantCode}/documents/${fileName}`);
    await deleteObject(storageRef);

    await deleteDoc(doc(db, "merchants", merchantCode, "documents", docId));
    console.log(`Deleted document ${docId} successfully.`);
  } catch (error) {
    console.error("Error deleting document:", error);
  }
};
