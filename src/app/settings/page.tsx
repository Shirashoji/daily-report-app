// src/app/settings/page.tsx
'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { useWorkTime } from '@/hooks/useWorkTime';
import { useGeminiModels } from '@/hooks/useGeminiModels';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ReactElement } from 'react';

/**
 * A page where users can configure their settings for various services.
 * The settings are saved to localStorage.
 * @returns {React.ReactElement} The settings page.
 */
export default function SettingsPage(): ReactElement {
  const { model, handleSetModel } = useSettings();
  const { workTimes, importWorkTimes } = useWorkTime();
  const { models: geminiModels, isLoading: modelsLoading, error: modelsError } = useGeminiModels();
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportWorkTimes = (): void => {
    const dataStr = JSON.stringify(workTimes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `work-times-${formatDate(new Date())}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setMessage('作業時間データをエクスポートしました。');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>): void => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          importWorkTimes(text);
          setMessage('作業時間データをインポートしました。');
          setTimeout(() => setMessage(''), 3000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">設定</h1>
        <Link href="/daily" className="text-blue-600 hover:underline">
          レポート作成ページに戻る
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Gemini</h2>
          <div className="p-4 border rounded-md">
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">Model:</label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => handleSetModel(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              disabled={modelsLoading || !!modelsError}
            >
              {modelsLoading && <option>Loading models...</option>}
              {modelsError && <option>Error loading models</option>}
              {!modelsLoading && !modelsError && geminiModels.map(m => (
                <option key={m.name} value={m.name}>
                  {m.displayName}
                </option>
              ))}
            </select>
            {modelsError && <p className="text-red-500 text-sm mt-1">{modelsError}</p>}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">作業時間データ</h2>
          <div className="space-y-4 p-4 border rounded-md">
            <div className="flex space-x-2">
              <Button onClick={handleExportWorkTimes}>
                エクスポート
              </Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                インポート
              </Button>
              <input
                type="file"
                id="import-file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {message && <p className="text-green-600 text-right mt-2">{message}</p>}
    </div>
  );
}