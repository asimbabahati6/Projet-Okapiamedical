import { supabase } from '../lib/supabase';

export type WorkflowStatus = 'draft' | 'pending_validation' | 'validated' | 'shared' | 'completed' | 'archived';
export type WorkflowStage = 'creation' | 'review' | 'validation' | 'distribution' | 'completion';
export type DocumentType = 'prescription' | 'lab_order' | 'consultation' | 'medical_document' | 'lab_result' | 'certificate';

export interface WorkflowStatusData {
  documentId: string;
  documentType: DocumentType;
  currentStatus: WorkflowStatus;
  assignedTo?: string;
  workflowStage: WorkflowStage;
}

export async function updateDocumentWorkflowStatus(
  documentId: string,
  documentType: DocumentType,
  newStatus: WorkflowStatus,
  assignedTo?: string
) {
  const { error } = await supabase.rpc('update_workflow_status', {
    p_document_id: documentId,
    p_document_type: documentType,
    p_new_status: newStatus,
    p_assigned_to: assignedTo || null
  });

  if (error) {
    console.error('Error updating workflow status:', error);
    throw error;
  }
}

export async function getDocumentWorkflowStatus(documentId: string, documentType: DocumentType) {
  const { data, error } = await supabase
    .from('document_workflow_status')
    .select('*')
    .eq('document_id', documentId)
    .eq('document_type', documentType)
    .maybeSingle();

  if (error) {
    console.error('Error fetching workflow status:', error);
    return null;
  }

  return data;
}

export async function getPendingDocuments(userId: string) {
  const { data, error } = await supabase
    .from('document_workflow_status')
    .select('*')
    .eq('assigned_to', userId)
    .in('current_status', ['pending_validation', 'draft'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending documents:', error);
    return [];
  }

  return data || [];
}

export async function shareDocument(
  documentId: string,
  documentType: DocumentType,
  sharedWithId: string,
  permissionLevel: 'view' | 'edit' | 'validate' = 'view',
  expiresAt?: Date
) {
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('document_shares')
    .insert({
      document_id: documentId,
      document_type: documentType,
      shared_by: currentUser.user.id,
      shared_with: sharedWithId,
      permission_level: permissionLevel,
      expires_at: expiresAt?.toISOString() || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error sharing document:', error);
    throw error;
  }

  return data;
}

export async function getSharedDocuments(userId: string) {
  const { data, error } = await supabase
    .from('document_shares')
    .select('*')
    .eq('shared_with', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shared documents:', error);
    return [];
  }

  return data || [];
}

export async function markDocumentAsViewed(shareId: string) {
  const { error } = await supabase
    .from('document_shares')
    .update({
      status: 'viewed',
      viewed_at: new Date().toISOString()
    })
    .eq('id', shareId);

  if (error) {
    console.error('Error marking document as viewed:', error);
    throw error;
  }
}

export async function addDocumentComment(
  documentId: string,
  documentType: DocumentType,
  commentText: string,
  isPrivate = false
) {
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('document_comments')
    .insert({
      document_id: documentId,
      document_type: documentType,
      author_id: currentUser.user.id,
      comment_text: commentText,
      is_private: isPrivate
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
}

export async function getDocumentComments(documentId: string, documentType: DocumentType) {
  const { data, error } = await supabase
    .from('document_comments')
    .select(`
      *,
      author:user_profiles!document_comments_author_id_fkey(full_name, role:roles(name))
    `)
    .eq('document_id', documentId)
    .eq('document_type', documentType)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data || [];
}

export async function createDigitalSignature(
  documentId: string,
  documentType: DocumentType,
  signatureData: string,
  signatureType: 'electronic' | 'biometric' | 'pin' = 'electronic',
  ipAddress?: string,
  deviceInfo?: string
) {
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('digital_signatures')
    .insert({
      document_id: documentId,
      document_type: documentType,
      signer_id: currentUser.user.id,
      signature_data: signatureData,
      signature_type: signatureType,
      ip_address: ipAddress,
      device_info: deviceInfo
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating digital signature:', error);
    throw error;
  }

  return data;
}

export async function getDocumentSignatures(documentId: string, documentType: DocumentType) {
  const { data, error } = await supabase
    .from('digital_signatures')
    .select(`
      *,
      signer:user_profiles!digital_signatures_signer_id_fkey(full_name, role:roles(name))
    `)
    .eq('document_id', documentId)
    .eq('document_type', documentType)
    .eq('is_valid', true)
    .order('signed_at', { ascending: false });

  if (error) {
    console.error('Error fetching signatures:', error);
    return [];
  }

  return data || [];
}

export async function checkMedicationInteractions(medicationIds: string[]) {
  const { data, error } = await supabase.rpc('check_medication_interactions', {
    p_medication_ids: medicationIds
  });

  if (error) {
    console.error('Error checking medication interactions:', error);
    return [];
  }

  return data || [];
}
