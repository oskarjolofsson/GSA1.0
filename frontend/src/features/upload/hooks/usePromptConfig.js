import { useState } from "react";

export function usePromptConfig() {
  const [advancedInput, setAdvancedInput] = useState({});
  const [AImodel, setAImodel] = useState("gemini-3-pro-preview");

  const resetConfig = () => {
    setAdvancedInput({});
    setAImodel("gemini-3-pro-preview");
  };

  return {
    advancedInput,
    setAdvancedInput,
    AImodel,
    setAImodel,
    resetConfig,
  };
}

