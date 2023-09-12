import { useCallback, useState } from 'react';

export const useUploadFile = ({
  fileName,
}: {
  fileName: string;
}): {
  file: File | null;
  setFile: (file: File | null) => void;
  onRemove: () => void;
  isUploading: boolean;
  onUpload: () => Promise<string>;
  isUploaded: boolean;
} => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const onSetFile = useCallback((file: File | null): void => {
    setFile(file);
    setIsUploaded(false);
  }, []);

  const onRemove = useCallback((): void => {
    setFile(null);
    setIsUploaded(false);
  }, []);

  const onUpload = useCallback(async (): Promise<string> => {
    if (!file) {
      return '';
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.set(file.name, file);

      const response = await fetch(`/api/uploadFile?name=${fileName}`, {
        method: 'POST',
        body: formData,
      });
      const { cid } = await response.json();

      setIsUploaded(true);
      return cid;
    } catch (error) {
      console.error(error);
      return '';
    } finally {
      setIsUploading(false);
    }
  }, [file, fileName]);

  return {
    file,
    setFile: onSetFile,
    isUploading,
    onUpload,
    onRemove,
    isUploaded,
  };
};
