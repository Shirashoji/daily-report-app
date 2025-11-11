import { Repository } from "./github";

/**
 * レポートの種類を示す型エイリアス。
 * - `daily`: 日報
 * - `meeting`: 議事録
 */
export type ReportType = "daily" | "meeting";

/**
 * レポート生成に必要な設定情報を格納するインターフェース。
 */
export interface ReportConfig {
  /**
   * レポートの種類。
   */
  type: ReportType;
  /**
   * レポートの対象期間の開始日時。
   */
  startDate: Date;
  /**
   * レポートの対象期間の終了日時。
   */
  endDate: Date;
  /**
   * レポートの対象となるGitHubリポジトリの情報。
   */
  repository: Repository;
}
