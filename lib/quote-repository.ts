// lib/services/quote-repository.ts
import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { getAuth } from "firebase/auth";
import { QuoteDetails } from "@/lib/quote";

export type SaveQuoteResult = {
  success: boolean;
  id?: string;
  error?: string;
};

export const saveQuoteAsDraft = async (quote: QuoteDetails): Promise<SaveQuoteResult> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }
    
    // Get the merchant code for the current user
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const merchantCode = userData?.merchantCode;
    
    if (!merchantCode) {
      return {
        success: false,
        error: "Merchant code not found"
      };
    }
    
    // Create a new doc reference with auto-id
    const quoteRef = doc(collection(db, `merchants/${merchantCode}/quotes`));
    
    // Set the document data
    const quoteData = {
      ...quote,
      id: quoteRef.id,
      createdBy: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft"
    };
    
    await setDoc(quoteRef, quoteData);
    
    return {
      success: true,
      id: quoteRef.id
    };
  } catch (error) {
    console.error("Error saving quote:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

export const convertQuoteToInvoice = async (quoteId: string): Promise<SaveQuoteResult> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }
    
    // Get the merchant code for the current user
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const merchantCode = userData?.merchantCode;
    
    if (!merchantCode) {
      return {
        success: false,
        error: "Merchant code not found"
      };
    }
    
    // Fetch the quote
    const quoteDoc = await getDoc(doc(db, `merchants/${merchantCode}/quotes`, quoteId));
    
    if (!quoteDoc.exists()) {
      return {
        success: false,
        error: "Quote not found"
      };
    }
    
    const quoteData = quoteDoc.data() as QuoteDetails & { id: string };
    
    // Generate invoice number (could implement a more sophisticated system)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    
    // Query to find the highest existing invoice number and increment
    const invoicesRef = collection(db, `merchants/${merchantCode}/invoices`);
    const q = query(
      invoicesRef, 
      where("invoiceNumber", ">=", `INV${dd}${mm}${yy}000`),
      where("invoiceNumber", "<=", `INV${dd}${mm}${yy}999`)
    );
    
    const querySnapshot = await getDocs(q);
    let highestNum = 0;
    
    querySnapshot.forEach(doc => {
      const invNum = doc.data().invoiceNumber;
      const num = parseInt(invNum.substring(invNum.length - 3));
      if (num > highestNum) highestNum = num;
    });
    
    const invoiceNumber = `INV${dd}${mm}${yy}${String(highestNum + 1).padStart(3, "0")}`;
    
    // Create a new invoice
    const invoiceRef = doc(collection(db, `merchants/${merchantCode}/invoices`));
    
    const invoiceData = {
      ...quoteData,
      id: invoiceRef.id,
      quoteId: quoteId,
      invoiceNumber: invoiceNumber,
      invoiceDate: today.toISOString().split("T")[0],
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdBy: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "unpaid"
    };
    
    // Save the invoice
    await setDoc(invoiceRef, invoiceData);
    
    // Update the quote status
    await setDoc(doc(db, `merchants/${merchantCode}/quotes`, quoteId), {
      ...quoteData,
      status: "converted",
      updatedAt: new Date(),
      invoiceId: invoiceRef.id,
    }, { merge: true });
    
    return {
      success: true,
      id: invoiceRef.id
    };
  } catch (error) {
    console.error("Error converting quote to invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};