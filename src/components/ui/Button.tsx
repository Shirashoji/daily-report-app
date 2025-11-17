// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode, ReactElement } from 'react';
import clsx from 'clsx';

/**
 * Buttonコンポーネントのプロパティの型定義。
 * `ButtonHTMLAttributes<HTMLButtonElement>`を拡張しています。
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * ボタンの見た目の種類。
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger';
  /**
   * ボタンのサイズ。
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * ボタン内に表示されるコンテンツ。
   */
  children: ReactNode;
  /**
   * 読み込み状態かどうか。trueの場合、ボタンは無効化され、「Loading...」と表示されます。
   * @default false
   */
  isLoading?: boolean;
}

/**
 * アプリケーション全体で再利用可能なボタンスタイルを提供するコンポーネント。
 * `variant`と`size`プロパティで見ためを、`isLoading`プロパティで読み込み状態を制御できます。
 * @param {ButtonProps} props - ボタンのプロパティ。
 * @returns {ReactElement} レンダリングされたbutton要素。
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={clsx(
        'font-bold rounded transition-colors',
        {
          'bg-blue-500 hover:bg-blue-700 text-white': variant === 'primary',
          'bg-gray-500 hover:bg-gray-700 text-white': variant === 'secondary',
          'bg-red-500 hover:bg-red-700 text-white': variant === 'danger',
          'py-1 px-2 text-sm': size === 'sm',
          'py-2 px-4 text-base': size === 'md',
          'py-3 px-6 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || isLoading,
        },
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
