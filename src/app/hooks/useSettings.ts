import { useState, useEffect } from 'react';

export function useSettings() {
  const [model, setModel] = useState('gemini-2.5-pro');

  useEffect(() => {
    const savedModel = localStorage.getItem('geminiModel');
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  const handleSetModel = (modelName: string) => {
    setModel(modelName);
    localStorage.setItem('geminiModel', modelName);
  };

  return {
    model,
    handleSetModel,
  };
}
