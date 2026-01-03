export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSignUpForm(data: {
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  barangay: string;
  contact: string;
  birthDate: string;
  password: string;
  repeatPassword: string;
}): ValidationResult {
  const {
    firstName,
    middleName,
    lastName,
    address,
    barangay,
    contact,
    birthDate,
    password,
    repeatPassword,
  } = data;

  if (!firstName.trim() || !lastName.trim()) {
    return { valid: false, error: "First name and last name are required" };
  }

  if (firstName.length < 2 || lastName.length < 2) {
    return { valid: false, error: "Names must be at least 2 characters long" };
  }

  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return {
      valid: false,
      error: "Names must contain only letters, spaces, hyphens, or apostrophes",
    };
  }

  if (middleName && !nameRegex.test(middleName)) {
    return {
      valid: false,
      error:
        "Middle name must contain only letters, spaces, hyphens, or apostrophes",
    };
  }

  // Address is now optional
  if (address && address.trim().length > 0 && address.trim().length < 5) {
    return {
      valid: false,
      error: "Address must be at least 5 characters if provided",
    };
  }

  if (!barangay.trim()) {
    return {
      valid: false,
      error: "Please select your barangay",
    };
  }

  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  if (!phoneRegex.test(contact.replace(/\s|-/g, ""))) {
    return {
      valid: false,
      error: "Please enter a valid Philippine phone number",
    };
  }

  const today = new Date();
  const birthDateObj = new Date(birthDate);
  const age = today.getFullYear() - birthDateObj.getFullYear();
  if (age < 13 || age > 120) {
    return { valid: false, error: "You must be between 13 and 120 years old" };
  }

  if (password.length < 6) {
    return {
      valid: false,
      error: "Password must be at least 6 characters long",
    };
  }

  if (password !== repeatPassword) {
    return { valid: false, error: "Passwords do not match" };
  }

  return { valid: true };
}
