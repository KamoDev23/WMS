import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, query, where } from "firebase/firestore";
import { storage } from "@/firebase/firebase-config";
import { ref, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
 import { db } from "@/firebase/firebase-config";
import { UploadedDocument } from "@/app/components/project/documents/upload-document";

/**
 * Fetch all documents for a given project under the correct merchant.
 */
export const fetchDocumentsForProject = async (merchantCode: string, projectId: string): Promise<UploadedDocument[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "merchants", merchantCode, "projects", projectId, "documents"));
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as UploadedDocument));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

/**
 * Upload a document to Firestore Storage and save metadata in Firestore.
 */
export const uploadDocument = async (
  merchantCode: string,
  projectId: string,
  file: File,
  docType: string,
  amount?: number // Optional amount parameter
): Promise<UploadedDocument | null> => {
  try {
    const ext = file.name.substring(file.name.lastIndexOf("."));
    // Query Firestore to find how many documents of this type already exist
    const docsQuery = query(
      collection(db, "merchants", merchantCode, "projects", projectId, "documents"),
      where("docType", "==", docType)
    );
    const querySnapshot = await getDocs(docsQuery);
    const versionNumber = querySnapshot.size + 1; // Increment based on existing count

    // Construct the new file name with version number
    const newFileName = `${projectId} - ${docType} (${versionNumber})${ext}`;
    const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${newFileName}`);

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata in Firestore without an undefined amount
    const docData: Omit<UploadedDocument, "id"> = {
      projectId,
      docType,
      fileName: newFileName,
      url: downloadURL,
      uploadedAt: new Date(),
      ...(amount !== undefined ? { amount } : {}), // only include if defined
    };

    const docRef = await addDoc(
      collection(db, "merchants", merchantCode, "projects", projectId, "documents"),
      docData
    );
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
};

  

/**
 * Delete a document from both Firestore and Storage.
 */
export const deleteDocument = async (merchantCode: string, projectId: string, docId: string, fileName: string) => {
  try {
    // Delete from Firebase Storage
    const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${fileName}`);
    await deleteObject(storageRef);

    // Delete metadata from Firestore
    await deleteDoc(doc(db, "merchants", merchantCode, "projects", projectId, "documents", docId));
  } catch (error) {
    console.error("Error deleting document:", error);
  }
};

/**
 * Update a document, preserving previous versions if needed.
 */
export const updateDocument = async (
  merchantCode: string,
  projectId: string,
  docId: string,
  newFile: File | null,
  newAmount?: number
) => {
  try {
    const docRef = doc(db, "merchants", merchantCode, "projects", projectId, "documents", docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error("Document not found.");
      return;
    }

    const existingDoc = docSnap.data() as UploadedDocument;
    let updatedData: Partial<UploadedDocument> = {};

    if (newFile) {
      const timestamp = Date.now();
      const ext = newFile.name.substring(newFile.name.lastIndexOf("."));
      const newFileName = `${projectId} - ${existingDoc.docType} - updated ${timestamp}${ext}`;
      const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${newFileName}`);

      // Upload new file
      const snapshot = await uploadBytes(storageRef, newFile);
      const newUrl = await getDownloadURL(snapshot.ref);

      updatedData = {
        url: newUrl,
        previousVersion: {
          fileUrl: existingDoc.url,
          amount: existingDoc.amount || 0,
        },
      };
    }

    if (newAmount !== undefined) {
      updatedData.amount = newAmount;
    }

    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("Error updating document:", error);
  }
};

/**
 * Deletes all documents within a project and then deletes the project itself.
 */
export const deleteProjectAndDocuments = async (merchantCode: string, projectId: string) => {
  try {
    // Reference to the project's documents collection
    const docsCollectionRef = collection(db, "merchants", merchantCode, "projects", projectId, "documents");

    // Fetch all documents in the project
    const querySnapshot = await getDocs(docsCollectionRef);

    // Delete each document's storage file and Firestore record
    const deletePromises = querySnapshot.docs.map(async (docSnap) => {
      const docData = docSnap.data();
      const fileName = docData.fileName;

      if (fileName) {
        const storageRef = ref(storage, `merchants/${merchantCode}/projects/${projectId}/documents/${fileName}`);
        await deleteObject(storageRef).catch((err) => console.error(`Error deleting file: ${fileName}`, err));
      }

      // Delete document from Firestore
      await deleteDoc(docSnap.ref);
    });

    await Promise.all(deletePromises);

    // Delete the project itself
    const projectRef = doc(db, "merchants", merchantCode, "projects", projectId);
    await deleteDoc(projectRef);

    console.log(`Project ${projectId} and all associated documents deleted successfully.`);
  } catch (error) {
    console.error("Error deleting project and its documents:", error);
  }
};

