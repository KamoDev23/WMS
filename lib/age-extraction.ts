/**
 * South African ID Number Validator and Parser
 * 
 * This utility validates South African ID numbers and extracts information like
 * date of birth, gender, and citizenship status.
 * 
 * SA ID Format: YYMMDD SSSS CCC A Z
 * - YYMMDD: Date of birth
 * - SSSS: Gender (females: 0000-4999, males: 5000-9999)
 * - CCC: Citizenship status
 * - A: Usually 8 or 9
 * - Z: Checksum digit
 */

interface SAIDInfo {
  isValid: boolean;
  dateOfBirth?: Date;
  age?: number;
  gender?: "Male" | "Female";
  isCitizen?: boolean;
  errorMessage?: string;
}

/**
 * Validates a South African ID number and extracts information from it
 */
export const validateSAID = (idNumber: string): SAIDInfo => {
  // Remove any spaces or hyphens
  const cleanId = idNumber.replace(/[\s-]/g, '');
  
  // Basic format validation
  if (!/^\d{13}$/.test(cleanId)) {
    return { 
      isValid: false,
      errorMessage: 'ID number must be 13 digits long'
    };
  }
  
  // Extract components
  const year = cleanId.substring(0, 2);
  const month = cleanId.substring(2, 4);
  const day = cleanId.substring(4, 6);
  const genderCode = parseInt(cleanId.substring(6, 10));
  const citizenshipCode = parseInt(cleanId.substring(10, 11));
  
  // Validate month (1-12)
  const monthNum = parseInt(month);
  if (monthNum < 1 || monthNum > 12) {
    return {
      isValid: false,
      errorMessage: 'Invalid month'
    };
  }
  
  // Validate day (1-31, with appropriate limits per month)
  const dayNum = parseInt(day);
  const maxDay = getMaxDaysInMonth(monthNum, parseInt(year));
  if (dayNum < 1 || dayNum > maxDay) {
    return {
      isValid: false,
      errorMessage: 'Invalid day for month'
    };
  }
  
  // Determine century for full year
  const currentYear = new Date().getFullYear();
  let fullYear = parseInt(year);
  const currentCentury = Math.floor(currentYear / 100) * 100;
  
  // If the 2-digit year would be in the future, assume the previous century
  if (currentCentury + fullYear > currentYear) {
    fullYear = (currentCentury - 100) + fullYear;
  } else {
    fullYear = currentCentury + fullYear;
  }
  
  // Create date of birth and calculate age
  const dob = new Date(fullYear, monthNum - 1, dayNum);
  const age = calculateAge(dob);
  
  // Determine gender
  const gender = genderCode >= 5000 ? "Male" : "Female";
  
  // Determine citizenship
  const isCitizen = citizenshipCode === 0;
  
  // Validate checksum
  if (!validateLuhnChecksum(cleanId)) {
    return {
      isValid: false,
      errorMessage: 'Invalid ID number (checksum failed)'
    };
  }
  
  return {
    isValid: true,
    dateOfBirth: dob,
    age,
    gender,
    isCitizen
  };
};

/**
 * Calculates age based on date of birth
 */
const calculateAge = (dob: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Gets the maximum number of days in a given month
 */
const getMaxDaysInMonth = (month: number, year: number): number => {
  // February special case for leap years
  if (month === 2) {
    // This simple leap year calculation is sufficient for ID validation
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    return isLeapYear ? 29 : 28;
  }
  
  // Months with 30 days
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  
  // All other months have 31 days
  return 31;
};

/**
 * Validates the ID number using the Luhn algorithm
 */
const validateLuhnChecksum = (idNumber: string): boolean => {
  let sum = 0;
  let alternate = false;
  
  // Calculate Luhn checksum
  for (let i = idNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(idNumber.charAt(i));
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  // Valid if sum is divisible by 10
  return sum % 10 === 0;
};