import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'patient-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadPatientPhoto(
  file: File,
  patientId: string
): Promise<PhotoUploadResult> {
  try {
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'Le fichier est trop volumineux. Taille maximale: 5MB',
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Format de fichier non supporté. Utilisez JPG, PNG ou WEBP',
      };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du téléchargement de la photo',
    };
  }
}

export async function updatePatientPhoto(
  file: File,
  patientId: string,
  oldPhotoUrl?: string
): Promise<PhotoUploadResult> {
  try {
    if (oldPhotoUrl) {
      await deletePatientPhoto(oldPhotoUrl);
    }

    return await uploadPatientPhoto(file, patientId);
  } catch (error: any) {
    console.error('Error updating photo:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de la photo',
    };
  }
}

export async function deletePatientPhoto(photoUrl: string): Promise<boolean> {
  try {
    const path = photoUrl.split('/').slice(-2).join('/');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
}

export async function getPatientPhotoUrl(patientId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('profile_photo_url')
      .eq('id', patientId)
      .single();

    if (error) throw error;

    return data?.profile_photo_url || null;
  } catch (error) {
    console.error('Error fetching patient photo:', error);
    return null;
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Le fichier est trop volumineux. Taille maximale: 5MB',
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format de fichier non supporté. Utilisez JPG, PNG ou WEBP',
    };
  }

  return { valid: true };
}

export function generateInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
}
