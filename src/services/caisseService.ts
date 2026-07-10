import { supabase } from '../lib/supabase';

export interface CaisseInfo {
  id: string;
  nom: string;
  type: 'auxiliaire' | 'permanente';
  solde_courant: number;
  devise: string;
}

export async function getCaisseByType(type: 'auxiliaire' | 'permanente'): Promise<CaisseInfo | null> {
  const { data } = await supabase
    .from('caisses')
    .select('*')
    .eq('type', type)
    .maybeSingle();
  return data as CaisseInfo | null;
}

export async function enregistrerMouvementEntree(params: {
  montant: number;
  devise: 'USD' | 'CDF';
  reference: string;
  motif: string;
}) {
  const caisse = await getCaisseByType('auxiliaire');
  if (!caisse) throw new Error('Caisse auxiliaire introuvable');

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { error } = await supabase.from('mouvements_caisse').insert({
    caisse_id: caisse.id,
    type: 'entree',
    montant: params.montant,
    devise: params.devise,
    reference: params.reference,
    motif: params.motif,
    effectue_par: userId,
  });

  if (error) throw error;
}

export async function enregistrerMouvementSortie(params: {
  montant: number;
  devise: 'USD' | 'CDF';
  reference: string;
  motif: string;
}) {
  const caisse = await getCaisseByType('auxiliaire');
  if (!caisse) throw new Error('Caisse auxiliaire introuvable');

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { error } = await supabase.from('mouvements_caisse').insert({
    caisse_id: caisse.id,
    type: 'sortie',
    montant: params.montant,
    devise: params.devise,
    reference: params.reference,
    motif: params.motif,
    effectue_par: userId,
  });

  if (error) throw error;
}

export async function getSoldeJourAuxiliaire(dateStr: string): Promise<{ usd: number; cdf: number }> {
  const { data } = await supabase
    .from('mouvements_caisse')
    .select('type, montant, devise, caisse_id, created_at')
    .gte('created_at', `${dateStr}T00:00:00`)
    .lte('created_at', `${dateStr}T23:59:59`);

  const caisse = await getCaisseByType('auxiliaire');
  if (!caisse || !data) return { usd: 0, cdf: 0 };

  let usd = 0;
  let cdf = 0;

  for (const m of data) {
    if (m.caisse_id !== caisse.id) continue;
    const sign = (m.type === 'entree' || m.type === 'transfert_entrant') ? 1 : -1;
    if (m.devise === 'CDF') cdf += sign * Number(m.montant);
    else usd += sign * Number(m.montant);
  }

  return { usd, cdf };
}

export async function effectuerTransfertVersPermanente(params: {
  montantUSD: number;
  montantCDF: number;
}) {
  const auxiliaire = await getCaisseByType('auxiliaire');
  const permanente = await getCaisseByType('permanente');
  if (!auxiliaire || !permanente) throw new Error('Caisses introuvables');

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  const now = new Date().toISOString();

  const mouvements: Array<{
    caisse_id: string;
    type: string;
    montant: number;
    devise: string;
    reference: string;
    motif: string;
    effectue_par: string | undefined;
  }> = [];

  if (params.montantUSD > 0) {
    mouvements.push({
      caisse_id: auxiliaire.id,
      type: 'transfert_sortant',
      montant: params.montantUSD,
      devise: 'USD',
      reference: `VIR-${new Date().toISOString().slice(0, 10)}`,
      motif: 'Virement de clôture vers caisse permanente',
      effectue_par: userId,
    });
    mouvements.push({
      caisse_id: permanente.id,
      type: 'transfert_entrant',
      montant: params.montantUSD,
      devise: 'USD',
      reference: `VIR-${new Date().toISOString().slice(0, 10)}`,
      motif: 'Virement reçu de la caisse auxiliaire',
      effectue_par: userId,
    });
  }

  if (params.montantCDF > 0) {
    mouvements.push({
      caisse_id: auxiliaire.id,
      type: 'transfert_sortant',
      montant: params.montantCDF,
      devise: 'CDF',
      reference: `VIR-${new Date().toISOString().slice(0, 10)}`,
      motif: 'Virement de clôture vers caisse permanente',
      effectue_par: userId,
    });
    mouvements.push({
      caisse_id: permanente.id,
      type: 'transfert_entrant',
      montant: params.montantCDF,
      devise: 'CDF',
      reference: `VIR-${new Date().toISOString().slice(0, 10)}`,
      motif: 'Virement reçu de la caisse auxiliaire',
      effectue_par: userId,
    });
  }

  if (mouvements.length > 0) {
    const { error } = await supabase.from('mouvements_caisse').insert(mouvements);
    if (error) throw error;
  }
}

export async function enregistrerEcart(params: {
  montantTheorique: number;
  montantPhysique: number;
  motif: string;
}) {
  const caisse = await getCaisseByType('auxiliaire');
  if (!caisse) throw new Error('Caisse auxiliaire introuvable');

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { error } = await supabase.from('ecarts_caisse').insert({
    caisse_id: caisse.id,
    date_cloture: new Date().toISOString().slice(0, 10),
    montant_theorique: params.montantTheorique,
    montant_physique: params.montantPhysique,
    motif_justification: params.motif,
    declare_par: userId,
  });

  if (error) throw error;
}

export async function getMouvementsPermanente(params?: { dateFrom?: string; dateTo?: string }) {
  const caisse = await getCaisseByType('permanente');
  if (!caisse) return [];

  let query = supabase
    .from('mouvements_caisse')
    .select('*')
    .eq('caisse_id', caisse.id)
    .order('created_at', { ascending: false });

  if (params?.dateFrom) query = query.gte('created_at', `${params.dateFrom}T00:00:00`);
  if (params?.dateTo) query = query.lte('created_at', `${params.dateTo}T23:59:59`);

  const { data } = await query;
  return data || [];
}

export async function getHistoriqueEcarts() {
  const { data } = await supabase
    .from('ecarts_caisse')
    .select('*')
    .order('date_cloture', { ascending: false });
  return data || [];
}

export async function getHistoriqueClotures() {
  const caisse = await getCaisseByType('auxiliaire');
  if (!caisse) return [];

  const { data: transferts } = await supabase
    .from('mouvements_caisse')
    .select('*')
    .eq('caisse_id', caisse.id)
    .eq('type', 'transfert_sortant')
    .order('created_at', { ascending: false });

  return transferts || [];
}
