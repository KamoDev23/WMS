import { auth, db, storage } from "@/firebase/firebase-config";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  age: string;
  gender: string;
  role: string;
  dateOfHire: string;
  phoneNumber: string;
  email: string;
  address: string;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  url: string;
  docType: "ID Copy" | "Employment Contract" | "Proof of Address" | "Other";
  employeeId: string;
}

/**
 * Fetches all employees for a merchant.
 */
export const fetchEmployees = async (merchantCode: string): Promise<Employee[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "merchants", merchantCode, "employees"));
      return querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id, // Assign Firestore document ID as "id"
        ...(docSnap.data() as Omit<Employee, "id">),
      }));
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  };
  

/**
 * Adds a new employee to Firestore under the correct merchant.
 */
export const addEmployee = async (merchantCode: string, employee: Employee): Promise<Employee | null> => {
    try {
      // Create document with the predetermined ID
      const docRef = doc(db, "merchants", merchantCode, "employees", employee.id);
      await setDoc(docRef, employee);
      
      return employee; // Return the employee with the formatted ID
    } catch (error) {
      console.error("Error adding employee:", error);
      return null;
    }
  };

  export const fetchUserMerchantCode = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) return null;
      return userDocSnap.data()?.merchantCode;
    } catch (error) {
      console.error("Error fetching merchant code:", error);
      return null;
    }
  };
  
  

/**
 * Fetches a single employee's details.
 */
export const fetchEmployeeById = async (merchantCode: string, employeeId: string): Promise<Employee | null> => {
    try {
      const docRef = doc(db, "merchants", merchantCode, "employees", employeeId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error("Employee not found.");
        return null;
      }
      
      return { 
        id: docSnap.id, 
        ...docSnap.data() 
      } as Employee;
    } catch (error) {
      console.error("Error fetching employee details:", error);
      return null;
    }
  };

/**
 * Deletes an employee from Firestore.
 */
export const deleteEmployee = async (merchantCode: string, employeeId: string) => {
    try {
      await deleteDoc(doc(db, "merchants", merchantCode, "employees", employeeId));
      console.log(`Deleted employee ${employeeId} successfully.`);
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

/**
 * Saves a new employee or updates an existing one.
 */
export const saveEmployee = async (merchantCode: string, employee: Employee) => {
  try {
    const docRef = doc(db, "merchants", merchantCode, "employees", employee.id);
    await setDoc(docRef, employee, { merge: true });
    console.log("Employee saved successfully.");
  } catch (error) {
    console.error("Error saving employee:", error);
  }
};

/**
 * Fetches employee documents from Firestore.
 */
export const fetchEmployeeDocuments = async (merchantCode: string, employeeId: string): Promise<UploadedDocument[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "merchants", merchantCode, "employees", employeeId, "documents"));
    return querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as UploadedDocument));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

/**
 * Uploads an employee document to Firebase Storage and saves metadata to Firestore.
 */
export const uploadEmployeeDocument = async (
  merchantCode: string,
  employeeId: string,
  file: File,
  docType: string
): Promise<UploadedDocument | null> => {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${docType}.${fileExt}`;
    const storageRef = ref(storage, `merchants/${merchantCode}/employees/${employeeId}/documents/${fileName}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata in Firestore
    const docRef = doc(collection(db, "merchants", merchantCode, "employees", employeeId, "documents"));
    const docData: UploadedDocument = {
      id: docRef.id,
      employeeId,
      docType: docType as UploadedDocument["docType"],
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
 * Deletes an employee document from Firestore and Firebase Storage.
 */
export const deleteEmployeeDocument = async (merchantCode: string, employeeId: string, docId: string, fileName: string) => {
  try {
    const storageRef = ref(storage, `merchants/${merchantCode}/employees/${employeeId}/documents/${fileName}`);
    await deleteObject(storageRef);

    await deleteDoc(doc(db, "merchants", merchantCode, "employees", employeeId, "documents", docId));
    console.log(`Deleted document ${docId} successfully.`);
  } catch (error) {
    console.error("Error deleting document:", error);
  }
};
