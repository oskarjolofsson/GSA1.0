import { createContext, useContext } from 'react';

export const ValidationContext = createContext(null);

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within ValidationProvider');
  }
  return context;
};

export const ValidationProvider = ({ children, validationState }) => {
  return (
    <ValidationContext.Provider value={validationState}>
      {children}
    </ValidationContext.Provider>
  );
};
