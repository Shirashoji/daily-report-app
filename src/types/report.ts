import { Repository } from './github';

export type ReportType = 'daily' | 'meeting';

export interface ReportConfig {
  type: ReportType;
  startDate: Date;
  endDate: Date;
  repository: Repository;
}
