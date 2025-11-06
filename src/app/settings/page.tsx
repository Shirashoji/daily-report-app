'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettings } from '../hooks/useSettings';

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
  const [message, setMessage] = useState('');

  const handleExportWorkTimes = () => {
    const workTimesJson = localStorage.getItem('workTimes');
    if (workTimesJson) {
      const blob = new Blob([workTimesJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work_times_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('作業時間データをエクスポートしました。');
    } else {
      setMessage('エクスポートする作業時間データがありません。');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImportWorkTimes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage('ファイルが選択されていません。');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        // データの形式を簡易的に検証
        if (Array.isArray(importedData) && importedData.every(item => 'start' in item && 'end' in item && 'memo' in item)) {
          localStorage.setItem('workTimes', JSON.stringify(importedData));
          setMessage('作業時間データをインポートしました。メインページに戻って確認してください。');
          // メインページにリダイレクトするか、リロードを促す
        } else {
          throw new Error('インポートされたJSONの形式が正しくありません。');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        setMessage(`データのインポートに失敗しました: ${errorMessage}`);
      }
      setTimeout(() => setMessage(''), 3000);
    };
    reader.readAsText(file);
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
                accept=".json"
                onChange={handleImportWorkTimes}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>
      </div>

      {message && <p className="text-green-600 text-right mt-2">{message}</p>}
    </div>
  );
}
