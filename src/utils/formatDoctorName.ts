/**
 * Utility to format doctor names consistently
 * Prevents duplicate "Dr." prefix
 */

/**
 * Format a doctor's name with "Dr." prefix
 * Avoids duplicate "Dr." if the name already starts with it
 *
 * @param name - The doctor's full name
 * @returns The formatted name with "Dr." prefix
 *
 * @example
 * formatDoctorName("Kabila Jean") // "Dr. Kabila Jean"
 * formatDoctorName("Dr. Kabila Jean") // "Dr. Kabila Jean"
 * formatDoctorName("Dr.Kabila Jean") // "Dr. Kabila Jean"
 */
export function formatDoctorName(name: string | undefined | null): string {
  if (!name) {
    return 'N/A';
  }

  const trimmedName = name.trim();

  // Check if name already starts with "Dr." or "Dr. "
  if (trimmedName.startsWith('Dr.')) {
    // Normalize spacing after "Dr."
    return trimmedName.replace(/^Dr\.\s*/, 'Dr. ');
  }

  return `Dr. ${trimmedName}`;
}

/**
 * Get doctor name without "Dr." prefix
 * Useful for database operations where we want to store names without titles
 *
 * @param name - The doctor's full name (with or without "Dr." prefix)
 * @returns The name without "Dr." prefix
 *
 * @example
 * removeDoctorPrefix("Dr. Kabila Jean") // "Kabila Jean"
 * removeDoctorPrefix("Kabila Jean") // "Kabila Jean"
 */
export function removeDoctorPrefix(name: string | undefined | null): string {
  if (!name) {
    return '';
  }

  return name.trim().replace(/^Dr\.\s*/, '');
}

/**
 * Check if a name has the "Dr." prefix
 *
 * @param name - The name to check
 * @returns true if the name starts with "Dr.", false otherwise
 */
export function hasDoctorPrefix(name: string | undefined | null): boolean {
  if (!name) {
    return false;
  }

  return name.trim().startsWith('Dr.');
}
