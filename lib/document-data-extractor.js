/**
 * A simpler approach to extract text from PDF documents
 * This uses regular expressions to identify key information from the text
 */
export const extractPreAuthInfo = async (fileBlob) => {
    try {
      // Read the file as text (assuming it's a PDF that contains text data)
      const text = await readFileAsText(fileBlob);
      console.log("File content for extraction:", text.substring(0, 500) + "...");
      
      // Extract relevant information using regex patterns
      const extractedInfo = {
        preAuthNumber: extractField(text, 'Pre-Authorisation Number[:\\s]*([\\d]+)'),
        clientName: extractField(text, 'Client Name\\/Department[:\\s]*([^\\n]+)'),
        clientCode: extractField(text, 'Client Code[:\\s]*([\\d]+)'),
        supplierName: extractField(text, 'Supplier Name[:\\s]*([^\\n]+)'),
        supplierCode: extractField(text, 'Supplier Code[:\\s]*([\\d]+)'),
        transmissionDate: extractField(text, 'Transmission Date[:\\s]*([\\d\\/]+)'),
        vehicleDescription: extractField(text, 'Vehicle Description[:\\s]*([^\\n]+)'),
        registrationNumber: extractField(text, 'Registration Number[:\\s]*([^\\n]+)'),
        chassisNumber: extractField(text, 'Chassis Number[:\\s]*([^\\n]+)'),
        engineNumber: extractField(text, 'Engine number[:\\s]*([^\\n]+)'),
        jobRequirements: extractField(text, 'JOB REQUIREMENTS[:\\s]*(.*?)ADDITIONAL ITEMS'),
      };
      
      console.log('Extracted Pre-Auth Information:', extractedInfo);
      return extractedInfo;
    } catch (error) {
      console.error('Error extracting Pre-Auth information:', error);
      throw error;
    }
  };
  
  /**
   * Helper function to read a file blob as text
   */
  const readFileAsText = (fileBlob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(fileBlob);
    });
  };
  
  /**
   * Helper function to extract field values using regex
   */
  const extractField = (text, pattern) => {
    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };