import { useState, useRef, useEffect } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import FilePreview from './FilePreview';

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  previewUrl?: string;
}

interface FileAttachmentUploadProps {
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export default function FileAttachmentUpload({ onAttachmentsChange }: FileAttachmentUploadProps) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedFiles: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 10 * 1024 * 1024) {
          alert(`Le fichier "${file.name}" est trop volumineux (max 10 MB)`);
          continue;
        }

        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        if (previewUrl) previewUrlsRef.current.push(previewUrl);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) {
          console.error('Error uploading file:', error);
          alert(`Erreur lors de l'upload de "${file.name}"`);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(data.path);

        uploadedFiles.push({
          id: data.path,
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size,
          previewUrl,
        });
      }

      const newAttachments = [...attachments, ...uploadedFiles];
      setAttachments(newAttachments);
      onAttachmentsChange(newAttachments);
    } catch (error) {
      console.error('Error in file upload:', error);
      alert('Erreur lors de l\'upload des fichiers');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (attachment: Attachment) => {
    try {
      await supabase.storage.from('chat-attachments').remove([attachment.id]);
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
        previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== attachment.previewUrl);
      }
    } catch (error) {
      console.error('Error removing attachment:', error);
    }
    const newAttachments = attachments.filter(a => a.id !== attachment.id);
    setAttachments(newAttachments);
    onAttachmentsChange(newAttachments);
  };

  const hasImages = attachments.some(a => a.type.startsWith('image/'));

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="p-3 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        title="Attacher un fichier"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {attachments.length > 0 && (
        <div className={`mt-2 ${hasImages ? 'flex flex-wrap gap-2' : 'space-y-2'}`}>
          {attachments.map((attachment) => (
            <FilePreview
              key={attachment.id}
              url={attachment.previewUrl ?? attachment.url}
              name={attachment.name}
              type={attachment.type}
              size={attachment.size}
              variant="staging"
              onRemove={() => removeAttachment(attachment)}
            />
          ))}
        </div>
      )}

      {uploading && (
        <p className="text-xs text-gray-400 mt-1 ml-1">
          Envoi en cours...
        </p>
      )}

      {attachments.length > 0 && !hasImages && (
        <p className="text-xs text-gray-400 mt-1 ml-1">
          {attachments.length} fichier{attachments.length > 1 ? 's' : ''} · {attachments.reduce((s, a) => s + a.size, 0) > 1024 * 1024
            ? (attachments.reduce((s, a) => s + a.size, 0) / (1024 * 1024)).toFixed(1) + ' MB'
            : (attachments.reduce((s, a) => s + a.size, 0) / 1024).toFixed(1) + ' KB'}
        </p>
      )}
    </div>
  );
}
