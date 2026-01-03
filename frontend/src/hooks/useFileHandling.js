import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for handling file selection, validation, and preview URL management
 * Throws errors for the component to handle
 * 
 * @param {Object} config - Validation configuration
 * @param {Function} config.validateFile - Custom validation function that throws on failure
 * @param {string[]} config.allowedTypes - Array of allowed MIME types (e.g., ['video/mp4', 'video/webm'])
 * @returns {Object} - {file, previewUrl, isLoading, handleFileSelection, handleDrop, removeFile}
 */
export const useFileHandling = (config = {}) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const defaultValidateFile = useCallback(async (f) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const arrayBuffer = reader.result;
        
        // Check for valid MP4 signature (ftyp box starts with 0x66747970)
        const view = new Uint8Array(arrayBuffer);
        const isMp4 = view.length > 8 && 
                      view[4] === 0x66 && view[5] === 0x74 && 
                      view[6] === 0x79 && view[7] === 0x70;
        
        // Check for WebM signature
        const isWebM = view.length > 4 && 
                       view[0] === 0x1A && view[1] === 0x45 && 
                       view[2] === 0xDF && view[3] === 0xA3;
        
        if (!isMp4 && !isWebM) {
          reject(new Error("Invalid video format. Please upload an MP4 or WebM file."));
          return;
        }
        
        // Create a fresh blob to ensure integrity
        const blob = new Blob([arrayBuffer], { type: f.type });
        const validatedFile = new File([blob], f.name, { 
          type: f.type,
          lastModified: f.lastModified 
        });
        resolve(validatedFile);
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file. Please try again."));
      };
      
      reader.onabort = () => {
        reject(new Error("File reading was cancelled."));
      };
      
      reader.readAsArrayBuffer(f);
    });
  }, []);

  const validateFile = config.validateFile || defaultValidateFile;
  const allowedTypes = config.allowedTypes || ['video/'];

  const validateFileType = (f) => {
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/')) {
        // Category match (e.g., 'video/')
        return f.type.startsWith(type);
      }
      // Exact match
      return f.type === type;
    });

    if (!isAllowed) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
  };

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
      validateFileType(f);

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