import { supabase } from '../lib/supabase';
import { EmployeeFormData } from '../types/employeeForm';

export interface Department {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, email, phone')
    .order('name');

  if (error) {
    console.error('Error fetching departments:', error);
    throw new Error('Erreur lors du chargement des départements');
  }

  return data || [];
}

export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, description')
    .order('name');

  if (error) {
    console.error('Error fetching roles:', error);
    throw new Error('Erreur lors du chargement des rôles');
  }

  return data || [];
}

export async function generateUniqueEmployeeNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const prefix = `EMP-${year}${month}${day}`;

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const employeeNumber = `${prefix}-${randomSuffix}`;

    const exists = await checkEmployeeNumberExists(employeeNumber);

    if (!exists) {
      return employeeNumber;
    }

    attempts++;
  }

  throw new Error('Impossible de générer un numéro d\'employé unique');
}

export async function checkEmployeeNumberExists(employeeNumber: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('hr_employees')
    .select('employee_number')
    .eq('employee_number', employeeNumber)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking employee number:', error);
    return true;
  }

  return data !== null;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const { data: authData } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', email)
    .maybeSingle();

  return authData !== null;
}

export async function createEmployee(formData: EmployeeFormData): Promise<{ success: boolean; employeeId?: string; error?: string }> {
  try {
    let userId: string;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.contactDetails.professionalEmail,
      password: generateTemporaryPassword(),
      options: {
        data: {
          full_name: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
        },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', formData.contactDetails.professionalEmail)
          .maybeSingle();

        if (existingUser) {
          return { success: false, error: 'Cet email est déjà utilisé par un autre utilisateur' };
        }
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Échec de la création de l\'utilisateur');
    }

    userId = authData.user.id;

    const { data: adminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'administrative_staff')
      .maybeSingle();

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
        phone: formData.contactDetails.primaryPhone,
        department_id: formData.professionalInfo.departmentId || null,
        role_id: adminRole?.id,
        is_active: true,
        employee_category: formData.professionalInfo.isMedicalStaff ? 'medical' : 'administrative',
        is_hr_employee: true,
        is_medical_staff: formData.professionalInfo.isMedicalStaff,
        date_of_birth: formData.personalInfo.dateOfBirth || null,
        place_of_birth: formData.personalInfo.placeOfBirth || null,
        nationality: formData.personalInfo.nationality || 'République Démocratique du Congo',
        gender: formData.personalInfo.gender || null,
        personal_email: formData.contactDetails.personalEmail || null,
        secondary_phone: formData.contactDetails.secondaryPhone || null,
        address: formData.contactDetails.streetAddress || null,
        address_number: formData.contactDetails.addressNumber || null,
        postal_code: formData.contactDetails.postalCode || null,
        city: formData.contactDetails.city || null,
        country: formData.contactDetails.country || 'République Démocratique du Congo',
        position: formData.professionalInfo.position || null,
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    const { error: hrError } = await supabase
      .from('hr_employees')
      .insert({
        id: userId,
        employee_number: formData.personalInfo.employeeNumber,
        hire_date: formData.professionalInfo.hireDate,
        employment_status: 'active',
        contract_type: formData.professionalInfo.contractType,
        salary_currency: formData.bankingInfo.currency || 'USD',
        bank_name: formData.bankingInfo.bankName || null,
        bank_account: formData.bankingInfo.iban || null,
        swift_code: formData.bankingInfo.bic || null,
        tax_id: formData.personalInfo.socialSecurityNumber || null,
        social_security_number: formData.personalInfo.socialSecurityNumber || null,
        emergency_contact_name: formData.emergencyContact.fullName,
        emergency_contact_phone: formData.emergencyContact.phone,
        emergency_contact_relationship: formData.emergencyContact.relationship,
        emergency_contact_email: formData.emergencyContact.email || null,
        emergency_contact_address: formData.emergencyContact.address || null,
      });

    if (hrError) {
      await supabase.auth.admin.deleteUser(userId);
      await supabase.from('user_profiles').delete().eq('id', userId);
      throw hrError;
    }

    if (formData.professionalInfo.isMedicalStaff) {
      const { error: medicalError } = await supabase
        .from('medical_staff')
        .insert({
          id: userId,
          license_number: formData.professionalInfo.rppsNumber || `LIC-${Date.now()}`,
          specialization: formData.professionalInfo.specialization,
          staff_type: 'doctor',
          staff_category: 'permanent',
          years_of_experience: 0,
          consultation_fee: 0,
          is_accepting_patients: true,
          telemedicine_enabled: false,
          rpps_number: formData.professionalInfo.rppsNumber || null,
          current_status: 'active',
        });

      if (medicalError) {
        console.error('Error creating medical staff:', medicalError);
      }
    }

    if (formData.academicBackground.educationEntries.length > 0) {
      const educationRecords = formData.academicBackground.educationEntries.map((entry, index) => ({
        employee_id: userId,
        education_level: entry.educationLevel,
        degree_title: entry.degreeTitle,
        institution: entry.institution,
        graduation_year: Number(entry.graduationYear),
        key_skills: entry.keySkills,
        display_order: index,
      }));

      const { error: educationError } = await supabase
        .from('employee_education')
        .insert(educationRecords);

      if (educationError) {
        console.error('Error inserting education records:', educationError);
      }
    }

    return { success: true, employeeId: userId };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return { success: false, error: error.message || 'Une erreur est survenue lors de la création de l\'employé' };
  }
}

function generateTemporaryPassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function getEmployeeById(employeeId: string): Promise<EmployeeFormData | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', employeeId)
      .maybeSingle();

    if (profileError || !profile) return null;

    const { data: hrEmployee, error: hrError } = await supabase
      .from('hr_employees')
      .select('*')
      .eq('id', employeeId)
      .maybeSingle();

    if (hrError || !hrEmployee) return null;

    const { data: education } = await supabase
      .from('employee_education')
      .select('*')
      .eq('employee_id', employeeId)
      .order('display_order');

    const { data: medical } = await supabase
      .from('medical_staff')
      .select('specialization, rpps_number')
      .eq('id', employeeId)
      .maybeSingle();

    const fullName = profile.full_name || '';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const formData: EmployeeFormData = {
      personalInfo: {
        employeeNumber: hrEmployee.employee_number,
        firstName: firstName || '',
        lastName: lastName || '',
        dateOfBirth: profile.date_of_birth || '',
        placeOfBirth: profile.place_of_birth || '',
        nationality: profile.nationality || 'République Démocratique du Congo',
        socialSecurityNumber: hrEmployee.social_security_number || '',
        gender: profile.gender || '',
      },
      academicBackground: {
        educationEntries: (education || []).map((edu, index) => ({
          id: `${index}`,
          educationLevel: edu.education_level || '',
          degreeTitle: edu.degree_title || '',
          institution: edu.institution || '',
          graduationYear: edu.graduation_year || '',
          keySkills: edu.key_skills || [],
        })),
      },
      contactDetails: {
        professionalEmail: profile.id,
        personalEmail: profile.personal_email || '',
        primaryPhone: profile.phone || '',
        secondaryPhone: profile.secondary_phone || '',
        streetAddress: profile.address || '',
        addressNumber: profile.address_number || '',
        postalCode: profile.postal_code || '',
        city: profile.city || '',
        country: profile.country || 'République Démocratique du Congo',
      },
      professionalInfo: {
        departmentId: profile.department_id || '',
        position: profile.position || '',
        contractType: hrEmployee.contract_type || '',
        employmentStatus: hrEmployee.employment_status || '',
        hireDate: hrEmployee.hire_date || '',
        isMedicalStaff: profile.is_medical_staff || false,
        rppsNumber: medical?.rpps_number || '',
        specialization: medical?.specialization || '',
      },
      bankingInfo: {
        bankName: hrEmployee.bank_name || '',
        iban: hrEmployee.bank_account || '',
        bic: hrEmployee.swift_code || '',
        accountHolder: profile.full_name,
        currency: hrEmployee.salary_currency || 'USD',
      },
      emergencyContact: {
        fullName: hrEmployee.emergency_contact_name || '',
        relationship: hrEmployee.emergency_contact_relationship || '',
        phone: hrEmployee.emergency_contact_phone || '',
        email: hrEmployee.emergency_contact_email || '',
        address: hrEmployee.emergency_contact_address || '',
      },
    };

    return formData;
  } catch (error) {
    console.error('Error fetching employee:', error);
    return null;
  }
}

export async function updateEmployee(userId: string, formData: Partial<EmployeeFormData>): Promise<{ success: boolean; error?: string }> {
  try {
    if (formData.personalInfo && formData.contactDetails) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
          phone: formData.contactDetails.primaryPhone,
          department_id: formData.professionalInfo?.departmentId || null,
          position: formData.professionalInfo?.position || null,
          date_of_birth: formData.personalInfo.dateOfBirth,
          place_of_birth: formData.personalInfo.placeOfBirth,
          nationality: formData.personalInfo.nationality,
          gender: formData.personalInfo.gender,
          personal_email: formData.contactDetails.personalEmail,
          secondary_phone: formData.contactDetails.secondaryPhone,
          address: formData.contactDetails.streetAddress,
          address_number: formData.contactDetails.addressNumber,
          postal_code: formData.contactDetails.postalCode,
          city: formData.contactDetails.city,
          country: formData.contactDetails.country,
        })
        .eq('id', userId);

      if (profileError) throw profileError;
    }

    if (formData.professionalInfo || formData.bankingInfo || formData.emergencyContact) {
      const updateData: any = {};

      if (formData.professionalInfo) {
        updateData.hire_date = formData.professionalInfo.hireDate;
        updateData.contract_type = formData.professionalInfo.contractType;
      }

      if (formData.bankingInfo) {
        updateData.bank_name = formData.bankingInfo.bankName;
        updateData.bank_account = formData.bankingInfo.iban;
        updateData.swift_code = formData.bankingInfo.bic;
        updateData.salary_currency = formData.bankingInfo.currency;
      }

      if (formData.emergencyContact) {
        updateData.emergency_contact_name = formData.emergencyContact.fullName;
        updateData.emergency_contact_phone = formData.emergencyContact.phone;
        updateData.emergency_contact_relationship = formData.emergencyContact.relationship;
        updateData.emergency_contact_email = formData.emergencyContact.email;
        updateData.emergency_contact_address = formData.emergencyContact.address;
      }

      const { error: hrError } = await supabase
        .from('hr_employees')
        .update(updateData)
        .eq('id', userId);

      if (hrError) throw hrError;
    }

    if (formData.academicBackground && formData.academicBackground.educationEntries.length > 0) {
      await supabase
        .from('employee_education')
        .delete()
        .eq('employee_id', userId);

      const educationRecords = formData.academicBackground.educationEntries.map((entry, index) => ({
        employee_id: userId,
        education_level: entry.educationLevel,
        degree_title: entry.degreeTitle,
        institution: entry.institution,
        graduation_year: Number(entry.graduationYear),
        key_skills: entry.keySkills,
        display_order: index,
      }));

      const { error: educationError } = await supabase
        .from('employee_education')
        .insert(educationRecords);

      if (educationError) throw educationError;
    }

    if (formData.professionalInfo && formData.professionalInfo.isMedicalStaff) {
      const { error: medicalError } = await supabase
        .from('medical_staff')
        .upsert({
          id: userId,
          specialization: formData.professionalInfo.specialization,
          rpps_number: formData.professionalInfo.rppsNumber,
        });

      if (medicalError) console.error('Error updating medical staff:', medicalError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return { success: false, error: error.message || 'Une erreur est survenue lors de la mise à jour' };
  }
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  notes: string | null;
  created_at: string;
}

export async function getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Erreur lors du chargement des documents');
  }

  return data || [];
}

export async function addEmployeeDocument(
  employeeId: string,
  documentType: string,
  documentName: string,
  fileUrl: string,
  fileSize: number,
  uploadedBy: string,
  notes?: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type: documentType,
        document_name: documentName,
        file_url: fileUrl,
        file_size: fileSize,
        uploaded_by: uploadedBy,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, documentId: data.id };
  } catch (error: any) {
    console.error('Error adding document:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteEmployeeDocument(documentId: string, fileUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
}
