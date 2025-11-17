// src/hooks/useSettings.ts
import { useState, useEffect } from 'react';

/**
 * `useSettings`フックが返す値の型定義。
 */
interface UseSettingsReturn {
  /** 現在選択されているAIモデル名。 */
  model: string;
  /** AIモデル名を設定し、localStorageに保存する関数。 */
  handleSetModel: (modelName: string) => void;
}

/**
 * アプリケーションの設定を管理するためのカスタムフック。
 * 現在は、レポート生成に使用するGeminiモデルの選択を管理します。
 * 設定はlocalStorageに永続化されます。
 * @returns {UseSettingsReturn} 選択中のモデルとそれを設定する関数を含むオブジェクト。
 */
export function useSettings(): UseSettingsReturn {
  // AIモデル名を管理するstate。デフォルト値を設定。
  const [model, setModel] = useState('gemini-1.5-pro-latest');

  // コンポーネントのマウント時にlocalStorageから保存されたモデル名を読み込む
  useEffect(() => {
    const savedModel = localStorage.getItem('geminiModel');
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  /**
   * AIモデル名を設定し、localStorageに保存する。
   * @param {string} modelName - 設定するモデル名。
   */
  const handleSetModel = (modelName: string): void => {
    setModel(modelName);
    localStorage.setItem('geminiModel', modelName);
  };

  return {
    model,
    handleSetModel,
  };
}
