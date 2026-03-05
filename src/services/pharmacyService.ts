import { supabase } from '../lib/supabase';
import {
  Medication,
  MedicationBatch,
  MedicationStockAlert,
  MedicationFormData,
  PharmacyStats,
  StockMovement,
  StockMovementType
} from '../types/pharmacy';

export async function getMedications(): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .order('generic_name');

  if (error) throw error;
  return data || [];
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createMedication(formData: MedicationFormData): Promise<Medication> {
  const medicationCode = formData.medication_code || await generateMedicationCode();

  const { data: medicationData, error: medicationError } = await supabase
    .from('medications')
    .insert([{
      medication_code: medicationCode,
      generic_name: formData.generic_name,
      brand_name: formData.brand_name,
      category: formData.category,
      dosage_form: formData.dosage_form,
      strength: formData.strength,
      unit_price: formData.unit_price,
      quantity_in_stock: formData.quantity_in_stock || 0,
      reorder_level: formData.reorder_level || 10,
      supplier: formData.supplier,
      is_controlled_substance: formData.is_controlled_substance || false,
      is_active: formData.is_active !== false
    }])
    .select()
    .single();

  if (medicationError) throw medicationError;

  if (formData.batch_number && formData.expiry_date && formData.quantity_in_stock) {
    await addBatch({
      medication_id: medicationData.id,
      batch_number: formData.batch_number,
      quantity: formData.quantity_in_stock,
      expiry_date: formData.expiry_date,
      manufacture_date: formData.manufacture_date,
      supplier: formData.supplier
    });
  }

  return medicationData;
}

export async function updateMedication(id: string, formData: Partial<MedicationFormData>): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMedicationBatches(medicationId: string): Promise<MedicationBatch[]> {
  const { data, error } = await supabase
    .from('medication_batches')
    .select('*')
    .eq('medication_id', medicationId)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addBatch(batchData: {
  medication_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  unit_cost_cdf?: number;
  unit_cost_usd?: number;
  manufacture_date?: string;
  supplier?: string;
  received_date?: string;
  notes?: string;
}): Promise<MedicationBatch> {
  const { data: batchResult, error: batchError } = await supabase
    .from('medication_batches')
    .insert([batchData])
    .select()
    .single();

  if (batchError) throw batchError;

  const { data: medication } = await supabase
    .from('medications')
    .select('quantity_in_stock')
    .eq('id', batchData.medication_id)
    .single();

  const currentStock = medication?.quantity_in_stock || 0;
  await updateStock(batchData.medication_id, currentStock + batchData.quantity, 'New batch added');

  const daysUntilExpiry = Math.ceil(
    (new Date(batchData.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 90) {
    await createAlert({
      alert_type: 'expiring_soon',
      medication_id: batchData.medication_id,
      batch_id: batchResult.id,
      alert_message: `Batch ${batchData.batch_number} expires in ${daysUntilExpiry} days`,
      severity: daysUntilExpiry < 30 ? 'high' : 'medium'
    });
  }

  return batchResult;
}

export async function updateStock(medicationId: string, newQuantity: number, reason: string): Promise<void> {
  const { error } = await supabase
    .from('medications')
    .update({
      quantity_in_stock: newQuantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', medicationId);

  if (error) throw error;

  const { data: medication } = await supabase
    .from('medications')
    .select('reorder_level')
    .eq('id', medicationId)
    .single();

  if (medication && newQuantity <= (medication.reorder_level || 0)) {
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (newQuantity === 0) severity = 'critical';
    else if (newQuantity < (medication.reorder_level || 0) / 2) severity = 'high';

    await createAlert({
      alert_type: 'low_stock',
      medication_id: medicationId,
      alert_message: `Stock level is ${newQuantity}, below reorder level`,
      severity
    });
  }
}

export async function recordStockMovement(
  medicationId: string,
  movementType: StockMovementType,
  quantity: number,
  reason: string | null,
  reference: string | null,
  userId: string
): Promise<void> {
  const { data: medication } = await supabase
    .from('medications')
    .select('quantity_in_stock')
    .eq('id', medicationId)
    .single();

  if (!medication) throw new Error('Medication not found');

  let newQuantity = medication.quantity_in_stock || 0;

  switch (movementType) {
    case 'in':
      newQuantity += quantity;
      break;
    case 'out':
    case 'expired':
    case 'damaged':
      newQuantity -= quantity;
      break;
    case 'adjustment':
      newQuantity = quantity;
      break;
  }

  if (newQuantity < 0) {
    throw new Error('Insufficient stock');
  }

  await updateStock(medicationId, newQuantity, reason || movementType);
}

export async function getStockAlerts(): Promise<MedicationStockAlert[]> {
  const { data, error } = await supabase
    .from('medication_stock_alerts')
    .select(`
      *,
      medication:medications(generic_name, brand_name)
    `)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function resolveAlert(alertId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('medication_stock_alerts')
    .update({
      is_resolved: true,
      resolved_by: userId,
      resolved_at: new Date().toISOString()
    })
    .eq('id', alertId);

  if (error) throw error;
}

export async function getExpiringMedications(days: number = 30): Promise<MedicationBatch[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('medication_batches')
    .select(`
      *,
      medication:medications(generic_name, brand_name)
    `)
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function generateMedicationCode(): Promise<string> {
  const prefix = 'MED';
  const year = new Date().getFullYear().toString().slice(-2);

  const { data, error } = await supabase
    .from('medications')
    .select('medication_code')
    .like('medication_code', `${prefix}${year}%`)
    .order('medication_code', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].medication_code.replace(`${prefix}${year}`, ''));
    return `${prefix}${year}${String(lastNumber + 1).padStart(4, '0')}`;
  }

  return `${prefix}${year}0001`;
}

export async function searchMedications(query: string): Promise<Medication[]> {
  const searchTerm = `%${query}%`;

  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .or(`generic_name.ilike.${searchTerm},brand_name.ilike.${searchTerm},medication_code.ilike.${searchTerm}`)
    .eq('is_active', true)
    .order('generic_name');

  if (error) throw error;
  return data || [];
}

export async function getMedicationsByCategory(category: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('generic_name');

  if (error) throw error;
  return data || [];
}

export async function getPharmacyStats(): Promise<PharmacyStats> {
  const { data: medications, error } = await supabase
    .from('medications')
    .select('quantity_in_stock, reorder_level, unit_price, is_active');

  if (error) throw error;

  const activeMedications = (medications || []).filter(m => m.is_active);

  const lowStockCount = activeMedications.filter(
    m => (m.quantity_in_stock || 0) <= (m.reorder_level || 0) && (m.quantity_in_stock || 0) > 0
  ).length;

  const outOfStockCount = activeMedications.filter(
    m => (m.quantity_in_stock || 0) === 0
  ).length;

  const totalStockValue = activeMedications.reduce(
    (sum, m) => sum + ((m.quantity_in_stock || 0) * (m.unit_price || 0)),
    0
  );

  const { data: expiringBatches } = await supabase
    .from('medication_batches')
    .select('id')
    .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .gte('expiry_date', new Date().toISOString().split('T')[0]);

  return {
    total_medications: activeMedications.length,
    low_stock_count: lowStockCount,
    expiring_soon_count: expiringBatches?.length || 0,
    total_stock_value: totalStockValue,
    out_of_stock_count: outOfStockCount
  };
}

async function createAlert(alertData: {
  alert_type: string;
  medication_id?: string;
  batch_id?: string;
  alert_message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}): Promise<void> {
  const { data: existing } = await supabase
    .from('medication_stock_alerts')
    .select('id')
    .eq('alert_type', alertData.alert_type)
    .eq('medication_id', alertData.medication_id || null)
    .eq('is_resolved', false)
    .maybeSingle();

  if (!existing) {
    await supabase.from('medication_stock_alerts').insert([alertData]);
  }
}
