// src/app/page.tsx
import { redirect } from "next/navigation";

/**
 * アプリケーションのホームページ。
 * このページにアクセスしたユーザーを自動的に `/daily` ページにリダイレクトします。
 * @returns {void} このコンポーネントはUIをレンダリングせず、リダイレクトのみを行います。
 */
export default function Home(): void {
  redirect("/daily");
}