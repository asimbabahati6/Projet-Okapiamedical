import { supabase } from '../lib/supabase';
import { EmployeeContract, ContractFormData, ContractWithEmployee, ContractStats } from '../types/contracts';

export async function getContracts(): Promise<ContractWithEmployee[]> {
  const { data, error } = await supabase
    .from('employee_contracts')
    .select(`
      *,
      employee:user_profiles!employee_contracts_employee_id_fkey(
        first_name,
        last_name,
        email
      ),
      department:departments(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(contract => ({
    ...contract,
    employee_name: contract.employee
      ? `${contract.employee.first_name} ${contract.employee.last_name}`
      : 'Unknown',
    employee_email: contract.employee?.email || '',
    department_name: contract.department?.name || null
  }));
}

export async function getContractById(id: string): Promise<ContractWithEmployee | null> {
  const { data, error } = await supabase
    .from('employee_contracts')
    .select(`
      *,
      employee:user_profiles!employee_contracts_employee_id_fkey(
        first_name,
        last_name,
        email
      ),
      department:departments(name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    employee_name: data.employee
      ? `${data.employee.first_name} ${data.employee.last_name}`
      : 'Unknown',
    employee_email: data.employee?.email || '',
    department_name: data.department?.name || null
  };
}

export async function getContractsByEmployee(employeeId: string): Promise<EmployeeContract[]> {
  const { data, error } = await supabase
    .from('employee_contracts')
    .select('*')
    .eq('employee_id', employeeId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createContract(formData: ContractFormData, userId: string): Promise<EmployeeContract> {
  const contractNumber = formData.contract_number || await generateContractNumber();

  const { data, error } = await supabase
    .from('employee_contracts')
    .insert([{
      ...formData,
      contract_number: contractNumber,
      contract_status: 'draft',
      renewal_alert_days: formData.renewal_alert_days || 30,
      renewal_count: 0,
      created_by: userId
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContract(id: string, formData: Partial<ContractFormData>): Promise<EmployeeContract> {
  const { data, error } = await supabase
    .from('employee_contracts')
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

export async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase
    .from('employee_contracts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getExpiringContracts(days: number = 30): Promise<ContractWithEmployee[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('employee_contracts')
    .select(`
      *,
      employee:user_profiles!employee_contracts_employee_id_fkey(
        first_name,
        last_name,
        email
      ),
      department:departments(name)
    `)
    .eq('contract_status', 'active')
    .not('end_date', 'is', null)
    .lte('end_date', futureDate.toISOString().split('T')[0])
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('end_date', { ascending: true });

  if (error) throw error;

  return (data || []).map(contract => ({
    ...contract,
    employee_name: contract.employee
      ? `${contract.employee.first_name} ${contract.employee.last_name}`
      : 'Unknown',
    employee_email: contract.employee?.email || '',
    department_name: contract.department?.name || null
  }));
}

export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CT${year}`;

  const { data, error } = await supabase
    .from('employee_contracts')
    .select('contract_number')
    .like('contract_number', `${prefix}%`)
    .order('contract_number', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].contract_number.replace(prefix, ''));
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
  }

  return `${prefix}0001`;
}

export async function renewContract(
  contractId: string,
  newData: Partial<ContractFormData>,
  userId: string
): Promise<EmployeeContract> {
  const oldContract = await getContractById(contractId);
  if (!oldContract) throw new Error('Contract not found');

  const contractNumber = await generateContractNumber();

  const { data, error } = await supabase
    .from('employee_contracts')
    .insert([{
      employee_id: oldContract.employee_id,
      contract_number: contractNumber,
      contract_type: newData.contract_type || oldContract.contract_type,
      start_date: newData.start_date || oldContract.end_date || new Date().toISOString().split('T')[0],
      end_date: newData.end_date,
      duration_months: newData.duration_months,
      position: newData.position || oldContract.position,
      department_id: newData.department_id || oldContract.department_id,
      base_salary_cdf: newData.base_salary_cdf || oldContract.base_salary_cdf,
      base_salary_usd: newData.base_salary_usd || oldContract.base_salary_usd,
      benefits: newData.benefits || oldContract.benefits,
      contract_status: 'active',
      renewal_alert_days: newData.renewal_alert_days || oldContract.renewal_alert_days,
      renewal_count: oldContract.renewal_count + 1,
      previous_contract_id: contractId,
      notes: newData.notes,
      created_by: userId
    }])
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('employee_contracts')
    .update({ contract_status: 'expired' })
    .eq('id', contractId);

  return data;
}

export async function getContractStats(): Promise<ContractStats> {
  const { data: allContracts, error } = await supabase
    .from('employee_contracts')
    .select('contract_status, end_date');

  if (error) throw error;

  const contracts = allContracts || [];
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  return {
    total: contracts.length,
    active: contracts.filter(c => c.contract_status === 'active').length,
    expiring_soon: contracts.filter(c => {
      if (c.contract_status !== 'active' || !c.end_date) return false;
      const endDate = new Date(c.end_date);
      return endDate >= today && endDate <= futureDate;
    }).length,
    expired: contracts.filter(c => c.contract_status === 'expired').length
  };
}

export async function activateContract(id: string): Promise<void> {
  const { error } = await supabase
    .from('employee_contracts')
    .update({ contract_status: 'active' })
    .eq('id', id);

  if (error) throw error;
}

export async function terminateContract(
  id: string,
  terminationDate: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('employee_contracts')
    .update({
      contract_status: 'terminated',
      termination_date: terminationDate,
      termination_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}
