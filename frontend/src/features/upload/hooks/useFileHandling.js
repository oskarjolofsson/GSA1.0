import { useState, useEffect, useCallback } from 'react';
import { validateVideoFile } from '../logic/videoValidator';
import { validateFileType as validateMimeType } from '../logic/fileTypeValidator';

/**
 * Custom hook for handling file selection, validation, and preview URL management
 * Throws errors for the component to handle
 * 
 * @param {Object} config - Validation configuration
 * @param {Function} config.validateFile - Custom validation function that throws on failure
 * @param {string[]} config.allowedTypes - Array of allowed MIME types (e.g., ['video/mp4', 'video/webm', 'video/mov'])
 * @returns {Object} - {file, previewUrl, isLoading, handleFileSelection, handleDrop, removeFile}
 */
export const useFileHandling = (config = {}) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateFile = config.validateFile || validateVideoFile;
  const allowedTypes = config.allowedTypes || ['video/'];

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const handleFileSelection = useCallback(async (files) => {
    if (!files || !files.length) {
      throw new Error('No file selected');
    }

    const f = files[0];

    try {
      // Validate file type
      validateMimeType(f, allowedTypes);

      setIsLoading(true);

      // Validate and prepare file
      const validatedFile = await validateFile(f);

      setFile(validatedFile);

      // Create preview URL from validated file
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(validatedFile);
      setPreviewUrl(url);
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [previewUrl, validateFile]);

  const handleDrop = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;

    try {
      await handleFileSelection(files);
    } catch (err) {
      throw err;
    }
  }, [handleFileSelection]);

  const removeFile = useCallback(() => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  return {
    file,
    previewUrl,
    isLoading,
    handleFileSelection,
    handleDrop,
    removeFile,
    setFile,
  };
};