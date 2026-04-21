import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseImageManagerReturn {
  editingId: string | null;
  saving: boolean;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  saveImage: (id: string, url: string) => Promise<void>;
  resetImage: (id: string, defaultUrl: string) => Promise<void>;
}

export function useImageManager(onUpdate: () => void): UseImageManagerReturn {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openEditor(id: string) {
    setEditingId(id);
  }

  function closeEditor() {
    setEditingId(null);
  }

  async function saveImage(id: string, url: string) {
    setSaving(true);
    try {
      await supabase.from('services').update({ image_url: url }).eq('id', id);
      onUpdate();
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function resetImage(id: string, defaultUrl: string) {
    setSaving(true);
    try {
      await supabase.from('services').update({ image_url: defaultUrl }).eq('id', id);
      onUpdate();
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  return { editingId, saving, openEditor, closeEditor, saveImage, resetImage };
}
