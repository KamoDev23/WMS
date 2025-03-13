import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { AccountingDocument } from "@/app/components/project/accounting/accounting";
 
/**
 * Fetch accounting-related documents for a given project under the correct merchant.
 */
export const fetchAccountingDocuments = async (
  merchantCode: string,
  projectId: string
): Promise<AccountingDocument[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "merchants", merchantCode, "projects", projectId, "documents")
    );

    return querySnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AccountingDocument))
      .filter((doc) =>
        ["Supplier Quote", "Supplier Invoice", "Repair Quote", "Remittance"].includes(doc.docType)
      );
  } catch (error) {
    console.error("Error fetching accounting documents:", error);
    return [];
  }
};

/**
 * Update the amount of an accounting document.
 */
export const updateAccountingDocumentAmount = async (
  merchantCode: string,
  projectId: string,
  docId: string,
  amount: number
) => {
  try {
    const docRef = doc(db, "merchants", merchantCode, "projects", projectId, "documents", docId);
    await updateDoc(docRef, { amount });

    console.log(`Updated amount for document ${docId} successfully.`);
  } catch (error) {
    console.error("Error updating document amount:", error);
  }
};
