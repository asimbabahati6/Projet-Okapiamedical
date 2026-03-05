export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidIBAN(iban: string): boolean {
  if (!iban) return false;

  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
    return false;
  }

  const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);

  let numericString = '';
  for (const char of rearranged) {
    if (char >= '0' && char <= '9') {
      numericString += char;
    } else if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else {
      return false;
    }
  }

  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
  }

  return remainder === 1;
}

export function isValidFrenchPhone(phone: string): boolean {
  if (!phone) return false;

  const cleanPhone = phone.replace(/[\s.-]/g, '');

  const patterns = [
    /^0[1-9]\d{8}$/,
    /^\+33[1-9]\d{8}$/,
    /^00243[0-9]{9}$/,
    /^\+243[0-9]{9}$/,
  ];

  return patterns.some(pattern => pattern.test(cleanPhone));
}

export function isValidBIC(bic: string): boolean {
  if (!bic) return false;

  const cleanBIC = bic.replace(/\s/g, '').toUpperCase();

  const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(cleanBIC);
}

export function isDateInPast(date: string): boolean {
  if (!date) return false;
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
}

export function isAdult(dateOfBirth: string, minAge: number = 18): boolean {
  if (!dateOfBirth) return false;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= minAge;
}

export function isValidPostalCode(postalCode: string, country: string): boolean {
  if (!postalCode) return false;

  const patterns: Record<string, RegExp> = {
    'France': /^[0-9]{5}$/,
    'République Démocratique du Congo': /^[A-Z0-9]{2,10}$/i,
  };

  const pattern = patterns[country] || /^[A-Z0-9\s-]{2,10}$/i;
  return pattern.test(postalCode);
}

export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

export function formatPhoneNumber(phone: string): string {
  const clean = phone.replace(/[\s.-]/g, '');

  if (clean.startsWith('0') && clean.length === 10) {
    return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  if (clean.startsWith('+243') && clean.length === 13) {
    return clean.replace(/(\+243)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }

  if (clean.startsWith('00243') && clean.length === 14) {
    return clean.replace(/(00243)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }

  return clean;
}

export function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function isHireDateValid(hireDate: string, dateOfBirth: string): boolean {
  if (!hireDate || !dateOfBirth) return false;

  const hire = new Date(hireDate);
  const birth = new Date(dateOfBirth);

  const minAge = 16;
  const ageAtHire = hire.getFullYear() - birth.getFullYear();

  return ageAtHire >= minAge;
}

export function isRequiredField(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  return false;
}

export function hasMinLength(value: string, minLength: number): boolean {
  return value && value.trim().length >= minLength;
}

export function hasMaxLength(value: string, maxLength: number): boolean {
  return !value || value.trim().length <= maxLength;
}

export function isValidGraduationYear(year: number, hireDate?: string): boolean {
  if (!year) return false;

  const currentYear = new Date().getFullYear();

  if (year < 1950 || year > currentYear) {
    return false;
  }

  if (hireDate) {
    const hireYear = new Date(hireDate).getFullYear();
    if (year >= hireYear) {
      return false;
    }
  }

  return true;
}

export function isValidSkill(skill: string): boolean {
  if (!skill) return false;
  const trimmedSkill = skill.trim();
  return trimmedSkill.length >= 1 && trimmedSkill.length <= 50;
}
