/*
  # Reset consultation_number_seq

  Resets the only named sequence in the public schema back to 1,
  so new consultations will be numbered starting from 1 again.
*/

ALTER SEQUENCE consultation_number_seq RESTART WITH 1;
