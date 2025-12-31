import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing validation errors in a scalable way
 * Stores validation errors by ID with associated messages
 * 
 * Usage:
 * const validation = useValidationState();
 * validation.setValidationError('trim', 'Video must be trimmed');
 * validation.clearValidationError('trim');
 * if (validation.hasErrors()) { ... }
 */
export const useValidationState = () => {
  const errorsRef = useRef({});

  const setValidationError = useCallback((errorId, message) => {
    errorsRef.current[errorId] = message;
  }, []);

  const clearValidationError = useCallback((errorId) => {
    delete errorsRef.current[errorId];
  }, []);

  const hasErrors = useCallback(() => {
    return Object.keys(errorsRef.current).length > 0;
  }, []);

  const getErrorMessages = useCallback(() => {
    return Object.values(errorsRef.current);
  }, []);

  const getFirstErrorMessage = useCallback(() => {
    const messages = Object.values(errorsRef.current);
    return messages.length > 0 ? messages[0] : null;
  }, []);

  const clearAllErrors = useCallback(() => {
    errorsRef.current = {};
  }, []);

  return {
    validationErrors: errorsRef.current,
    setValidationError,
    clearValidationError,
    hasErrors,
    getErrorMessages,
    getFirstErrorMessage,
    clearAllErrors,
  };
};
