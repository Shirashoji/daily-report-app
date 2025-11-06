'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useSettings } from '../hooks/useSettings';
import { useWorkTime } from '../hooks/useWorkTime';
import { formatDate } from '../../lib/utils';

/**
 * A page where users can configure their settings for various services.
 * The settings are saved to localStorage.
 * @returns {React.ReactElement} The settings page.
 */
export default function SettingsPage() {
  const {
    model,
    handleSetModel,
  } = useSettings();
  const { workTimes, importWorkTimes } = useWorkTime();
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportWorkTimes = () => {
    const dataStr = JSON.stringify(workTimes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `work-times-${formatDate(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setMessage('作業時間データをエクスポートしました。');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
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
        <Link href="/" className="text-blue-600 hover:underline">
          メインページに戻る
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
            >
              <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">作業時間データ</h2>
          <div className="space-y-4 p-4 border rounded-md">
            <div>
              <button
                onClick={handleExportWorkTimes}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                作業時間データをJSONでエクスポート
              </button>
            </div>
            <div>
              <label htmlFor="import-file" className="block text-sm font-medium text-gray-700 mb-2">作業時間データをJSONでインポート:</label>
              <input
                type="file"
                id="import-file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                ファイルを選択
              </button>
            </div>
          </div>
        </div>
      </div>

      {message && <p className="text-green-600 text-right mt-2">{message}</p>}
    </div>
  );
}
