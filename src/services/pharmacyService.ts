import { supabase } from '../lib/supabase';
import type {
  PharmacyMedication,
  StockMovement,
  StockMovementType,
  PharmacyStats,
  MedicationFormData,
  PrescriptionQueueItem,
  DispensationRecord
} from '../types/pharmacy';

export async function getMedications(): Promise<PharmacyMedication[]> {
  const { data, error } = await supabase
    .from('pharmacy_medications')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getMedicationById(id: string): Promise<PharmacyMedication | null> {
  const { data, error } = await supabase
    .from('pharmacy_medications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createMedication(formData: MedicationFormData): Promise<PharmacyMedication> {
  const code = formData.code || await generateMedicationCode();

  const { data, error } = await supabase
    .from('pharmacy_medications')
    .insert([{
      code,
      name: formData.name,
      generic_name: formData.generic_name || null,
      category: formData.category,
      dosage: formData.dosage,
      form: formData.form,
      unit_price: formData.unit_price,
      currency: 'USD',
      current_stock: formData.current_stock,
      minimum_stock: formData.minimum_stock,
      maximum_stock: formData.maximum_stock,
      expiry_date: formData.expiry_date || null,
      manufacturer: formData.manufacturer || null,
      batch_number: formData.batch_number || null,
      storage_conditions: formData.storage_conditions || null,
      requires_prescription: formData.requires_prescription,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMedication(id: string, formData: Partial<MedicationFormData>): Promise<PharmacyMedication> {
  const { data, error } = await supabase
    .from('pharmacy_medications')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await supabase
    .from('pharmacy_medications')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function searchMedications(query: string): Promise<PharmacyMedication[]> {
  const searchTerm = `%${query}%`;

  const { data, error } = await supabase
    .from('pharmacy_medications')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm},code.ilike.${searchTerm}`)
    .order('name')
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function getMedicationsByCategory(category: string): Promise<PharmacyMedication[]> {
  const { data, error } = await supabase
    .from('pharmacy_medications')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getPharmacyStats(): Promise<PharmacyStats> {
  const { data: medications, error } = await supabase
    .from('pharmacy_medications')
    .select('current_stock, minimum_stock, unit_price, category, is_active')
    .eq('is_active', true);

  if (error) throw error;

  const meds = medications || [];

  const lowStockCount = meds.filter(
    m => m.current_stock > 0 && m.current_stock < m.minimum_stock
  ).length;

  const outOfStockCount = meds.filter(m => m.current_stock === 0).length;

  const totalStockValue = meds.reduce(
    (sum, m) => sum + (m.current_stock * m.unit_price),
    0
  );

  const categories = new Set(meds.map(m => m.category));

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { count: expiringCount } = await supabase
    .from('pharmacy_medications')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .gte('expiry_date', today)
    .lte('expiry_date', thirtyDaysLater);

  const { count: dispensedCount } = await supabase
    .from('pharmacy_dispensation_records')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date().toISOString().split('T')[0]);

  return {
    total_medications: meds.length,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    expiring_soon_count: expiringCount || 0,
    total_stock_value: totalStockValue,
    dispensed_today: dispensedCount || 0,
    total_categories: categories.size
  };
}

export async function recordStockMovement(
  medicationId: string,
  movementType: StockMovementType,
  quantity: number,
  reason: string | null,
  referenceNumber: string | null
): Promise<StockMovement> {
  const { data: medication } = await supabase
    .from('pharmacy_medications')
    .select('current_stock, unit_price')
    .eq('id', medicationId)
    .single();

  if (!medication) throw new Error('Médicament introuvable');

  const previousStock = medication.current_stock;
  let newStock = previousStock;

  switch (movementType) {
    case 'reception':
    case 'return':
      newStock = previousStock + quantity;
      break;
    case 'dispensation':
    case 'loss':
    case 'expiry':
      newStock = previousStock - quantity;
      break;
    case 'adjustment':
      newStock = quantity;
      break;
  }

  if (newStock < 0) throw new Error('Stock insuffisant');

  const { data: movement, error: movementError } = await supabase
    .from('pharmacy_stock_movements')
    .insert([{
      medication_id: medicationId,
      movement_type: movementType,
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      unit_cost: medication.unit_price,
      total_cost: quantity * medication.unit_price,
      reference_number: referenceNumber,
      reason,
      performed_by: (await supabase.auth.getUser()).data.user?.id || null
    }])
    .select()
    .single();

  if (movementError) throw movementError;

  const { error: updateError } = await supabase
    .from('pharmacy_medications')
    .update({ current_stock: newStock })
    .eq('id', medicationId);

  if (updateError) throw updateError;

  return movement;
}

export async function getStockMovements(medicationId?: string, limit = 50): Promise<StockMovement[]> {
  let query = supabase
    .from('pharmacy_stock_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (medicationId) {
    query = query.eq('medication_id', medicationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRecentMovements(limit = 20): Promise<(StockMovement & { medication_name?: string })[]> {
  const { data, error } = await supabase
    .from('pharmacy_stock_movements')
    .select('*, medication:pharmacy_medications(name, code)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((m: any) => ({
    ...m,
    medication_name: m.medication?.name || 'Inconnu'
  }));
}

export async function getPrescriptionQueue(): Promise<PrescriptionQueueItem[]> {
  const { data, error } = await supabase
    .from('pharmacy_prescriptions_queue')
    .select('*')
    .in('status', ['pending', 'in_preparation', 'ready'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDispensationRecords(limit = 50): Promise<DispensationRecord[]> {
  const { data, error } = await supabase
    .from('pharmacy_dispensation_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function generateMedicationCode(): Promise<string> {
  const { data } = await supabase
    .from('pharmacy_medications')
    .select('code')
    .like('code', 'MED-%')
    .order('code', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastNum = parseInt(data[0].code.replace('MED-', ''));
    return `MED-${String(lastNum + 1).padStart(3, '0')}`;
  }
  return 'MED-046';
}

export async function getExpiringMedications(days = 90): Promise<PharmacyMedication[]> {
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('pharmacy_medications')
    .select('*')
    .eq('is_active', true)
    .gte('expiry_date', today)
    .lte('expiry_date', futureDate)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLowStockMedications(): Promise<PharmacyMedication[]> {
  const { data, error } = await supabase
    .from('pharmacy_medications')
    .select('*')
    .eq('is_active', true)
    .or('current_stock.eq.0,current_stock.lt.minimum_stock')
    .order('current_stock', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryStats(): Promise<{ category: string; count: number; value: number }[]> {
  const { data, error } = await supabase
    .from('pharmacy_medications')
    .select('category, current_stock, unit_price')
    .eq('is_active', true);

  if (error) throw error;

  const categoryMap = new Map<string, { count: number; value: number }>();
  (data || []).forEach(m => {
    const existing = categoryMap.get(m.category) || { count: 0, value: 0 };
    categoryMap.set(m.category, {
      count: existing.count + 1,
      value: existing.value + (m.current_stock * m.unit_price)
    });
  });

  return Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    ...stats
  }));
}
