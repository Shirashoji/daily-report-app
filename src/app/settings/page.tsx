// src/app/settings/page.tsx
'use client';

import { useState, useRef, ReactElement } from 'react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { useWorkTime } from '@/hooks/useWorkTime';
import { useGeminiModels } from '@/hooks/useGeminiModels';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

/**
 * アプリケーションの各種設定を行うページコンポーネント。
 * 設定はlocalStorageに保存されます。
 * @returns {ReactElement} 設定ページのUI。
 */
export default function SettingsPage(): ReactElement {
  // 各種設定やデータを管理するカスタムフック
  const { model, handleSetModel } = useSettings();
  const { workTimes, importWorkTimes } = useWorkTime();
  const { models: geminiModels, isLoading: modelsLoading, error: modelsError } = useGeminiModels();

  // ユーザーへの通知メッセージを管理するstate
  const [message, setMessage] = useState('');
  // ファイルインポート用のinput要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 記録された作業時間データをJSONファイルとしてエクスポートする。
   */
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

  /**
   * ファイル選択イベントをハンドリングし、JSONファイルを読み込んで作業時間データをインポートする。
   * @param {React.ChangeEvent<HTMLInputElement>} event - ファイル選択イベント。
   */
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
        {/* Geminiモデル設定セクション */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Gemini</h2>
          <div className="p-4 border rounded-md">
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">
              Model:
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => handleSetModel(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              disabled={modelsLoading || !!modelsError}
            >
              {modelsLoading && <option>モデルを読み込み中...</option>}
              {modelsError && <option>モデルの読み込みに失敗</option>}
              {!modelsLoading &&
                !modelsError &&
                geminiModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.displayName}
                  </option>
                ))}
            </select>
            {modelsError && <p className="text-red-500 text-sm mt-1">{modelsError}</p>}
          </div>
        </div>

        {/* 作業時間データ管理セクション */}
        <div>
          <h2 className="text-xl font-semibold mb-2">作業時間データ</h2>
          <div className="space-y-4 p-4 border rounded-md">
            <div className="flex space-x-2">
              <Button onClick={handleExportWorkTimes}>エクスポート</Button>
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

      {/* 操作結果のメッセージ表示 */}
      {message && <p className="text-green-600 text-right mt-2">{message}</p>}
    </div>
  );
}
