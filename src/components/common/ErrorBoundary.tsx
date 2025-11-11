// src/components/common/ErrorBoundary.tsx
"use client";

import { Component, ReactNode, ErrorInfo } from "react";

/**
 * `ErrorBoundary`コンポーネントのプロパティの型定義。
 */
interface Props {
  /** エラーが発生しなかった場合に表示される子コンポーネント。 */
  children: ReactNode;
  /** エラー発生時に表示される代替UI。指定されない場合はデフォルトのエラーUIが表示されます。 */
  fallback?: ReactNode;
}

/**
 * `ErrorBoundary`コンポーネントの状態の型定義。
 */
interface State {
  /** エラーが発生したかどうかを示すフラグ。 */
  hasError: boolean;
  /** 発生したエラーオブジェクト。 */
  error?: Error;
}

/**
 * 子コンポーネントツリーで発生したJavaScriptエラーをキャッチし、
 * フォールバックUIを表示するための汎用的なエラーバウンダリコンポーネント。
 */
export class ErrorBoundary extends Component<Props, State> {
  /**
   * コンポーネントの初期状態を設定します。
   * @param {Props} props - コンポーネントのプロパティ。
   */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * 子孫コンポーネントでエラーがスローされた後に呼び出されます。
   * エラーが発生したことを示すためにstateを更新します。
   * @param {Error} error - スローされたエラー。
   * @returns {State} 更新後のstate。
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * 子孫コンポーネントでエラーがキャッチされた後に呼び出されます。
   * エラー情報をログに出力するために使用します。
   * @param {Error} error - キャッチされたエラー。
   * @param {ErrorInfo} errorInfo - エラーに関する追加情報（コンポーネントスタックなど）。
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundaryによってキャッチされたエラー:", error, errorInfo);
  }

  /**
   * コンポーネントのレンダリングを行います。
   * @returns {ReactNode} エラーがあればフォールバックUIを、なければ子コンポーネントを返します。
   */
  render(): ReactNode {
    // エラーが発生している場合、フォールバックUIを表示
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h2 className="text-red-800 font-bold">エラーが発生しました</h2>
            <p className="text-red-600">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    // エラーがなければ、子コンポーネントをそのまま表示
    return this.props.children;
  }
}