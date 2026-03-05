import FilePreview from './FilePreview';

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
}

export default function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const images = attachments.filter(a => a.type.startsWith('image/'));
  const files = attachments.filter(a => !a.type.startsWith('image/'));

  return (
    <div className="mt-2 space-y-2">
      {images.length > 0 && (
        <div className={`flex flex-wrap gap-2`}>
          {images.map((attachment) => (
            <FilePreview
              key={attachment.id}
              url={attachment.url}
              name={attachment.name}
              type={attachment.type}
              size={attachment.size}
              variant="message"
              onDownload={() => handleDownload(attachment.url, attachment.name)}
            />
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((attachment) => (
            <FilePreview
              key={attachment.id}
              url={attachment.url}
              name={attachment.name}
              type={attachment.type}
              size={attachment.size}
              variant="message"
              onDownload={() => handleDownload(attachment.url, attachment.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
