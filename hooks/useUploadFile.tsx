import { useCallback, useState } from 'react';

export const useUploadFile = (): {
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
  }, []);

  const onRemove = useCallback((): void => {
    setFile(null);
  }, []);

  const onUpload = useCallback(async (): Promise<string> => {
    if (!file) {
      return '';
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.set(file.name, file);

      const response = await fetch('/api/uploadFile', {
        method: 'POST',
        body: formData,
      });
      const { url } = await response.json();

      setIsUploaded(true);
      return url;
    } catch (error) {
      console.error(error);
      return '';
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  return {
    file,
    setFile: onSetFile,
    isUploading,
    onUpload,
    onRemove,
    isUploaded,
  };
};
