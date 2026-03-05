import { supabase } from '../lib/supabase';

const BUCKET = 'punch-selfies';
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.75;

export async function ensureBucketExists(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some(b => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: false });
  }
}

export function compressImage(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Image compression failed'));
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export async function uploadSelfie(
  staffId: string,
  punchType: string,
  dataUrl: string
): Promise<{ storagePath: string; publicUrl: string | null; fileSize: number }> {
  const blob = await compressImage(dataUrl);
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const storagePath = `${staffId}/${date}/${punchType}_${timestamp}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: signedData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600 * 24 * 30);

  return {
    storagePath,
    publicUrl: signedData?.signedUrl ?? null,
    fileSize: blob.size,
  };
}

export async function getSignedSelfieUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}
