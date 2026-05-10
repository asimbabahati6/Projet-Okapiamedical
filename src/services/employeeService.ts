import { supabase } from '../lib/supabase';
import { EmployeeFormData } from '../types/employeeForm';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
}

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, description, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createEmployee(formData: EmployeeFormData): Promise<string> {
  const employeeNumber = await generateUniqueEmployeeNumber();

  const { data, error } = await supabase
    .from('employees')
    .insert({
      employee_number: employeeNumber,
      first_name: formData.personalInfo.firstName,
      last_name: formData.personalInfo.lastName,
      date_of_birth: formData.personalInfo.dateOfBirth,
      gender: formData.personalInfo.gender,
      nationality: formData.personalInfo.nationality,
      phone: formData.contactDetails.primaryPhone,
      email: formData.contactDetails.professionalEmail || formData.contactDetails.personalEmail,
      address: formData.contactDetails.streetAddress,
      city: formData.contactDetails.city,
      department_id: formData.professionalInfo.departmentId || null,
      position: formData.professionalInfo.position,
      contract_type: formData.professionalInfo.contractType,
      employment_status: formData.professionalInfo.employmentStatus,
      hire_date: formData.professionalInfo.hireDate,
      bank_name: formData.bankingInfo.bankName,
      bank_account: formData.bankingInfo.iban,
      emergency_contact_name: formData.emergencyContact.fullName,
      emergency_contact_phone: formData.emergencyContact.phone,
      emergency_contact_relationship: formData.emergencyContact.relationship,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateEmployee(id: string, formData: Partial<EmployeeFormData>): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (formData.personalInfo) {
    updates.first_name = formData.personalInfo.firstName;
    updates.last_name = formData.personalInfo.lastName;
    updates.date_of_birth = formData.personalInfo.dateOfBirth;
    updates.gender = formData.personalInfo.gender;
    updates.nationality = formData.personalInfo.nationality;
  }

  if (formData.contactDetails) {
    updates.phone = formData.contactDetails.primaryPhone;
    updates.email = formData.contactDetails.professionalEmail || formData.contactDetails.personalEmail;
    updates.address = formData.contactDetails.streetAddress;
    updates.city = formData.contactDetails.city;
  }

  if (formData.professionalInfo) {
    updates.department_id = formData.professionalInfo.departmentId || null;
    updates.position = formData.professionalInfo.position;
    updates.contract_type = formData.professionalInfo.contractType;
    updates.employment_status = formData.professionalInfo.employmentStatus;
    updates.hire_date = formData.professionalInfo.hireDate;
  }

  if (formData.bankingInfo) {
    updates.bank_name = formData.bankingInfo.bankName;
    updates.bank_account = formData.bankingInfo.iban;
  }

  if (formData.emergencyContact) {
    updates.emergency_contact_name = formData.emergencyContact.fullName;
    updates.emergency_contact_phone = formData.emergencyContact.phone;
    updates.emergency_contact_relationship = formData.emergencyContact.relationship;
  }

  const { error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function generateUniqueEmployeeNumber(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const { count } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });

  const nextNum = ((count || 0) + 1).toString().padStart(4, '0');
  return `EMP-${year}${nextNum}`;
}

export async function getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addEmployeeDocument(doc: {
  employee_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string | null;
  notes?: string;
}): Promise<EmployeeDocument> {
  const { data, error } = await supabase
    .from('employee_documents')
    .insert(doc)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmployeeDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('employee_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
