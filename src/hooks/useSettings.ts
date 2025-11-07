// src/hooks/useSettings.ts
import { useState, useEffect } from 'react';

interface UseSettingsReturn {
  model: string;
  handleSetModel: (modelName: string) => void;
}

/**
 * Custom hook to manage application settings.
 * Currently, it only manages the Gemini model selection.
 * @returns {UseSettingsReturn} An object containing the model and a function to set it.
 */
export function useSettings(): UseSettingsReturn {
  const [model, setModel] = useState('gemini-1.5-pro-latest');

  useEffect(() => {
    const savedModel = localStorage.getItem('geminiModel');
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  const handleSetModel = (modelName: string): void => {
    setModel(modelName);
    localStorage.setItem('geminiModel', modelName);
  };

  return {
    model,
    handleSetModel,
  };
}
