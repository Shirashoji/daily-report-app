// src/lib/utils/report.ts
import type { ReportType, WorkTime } from '@/types/report';

const formatDate = (date: Date): string => {
  return date
    .toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .join('-');
};

const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0) return '0分';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours > 0 ? `${hours}時間` : ''}${minutes > 0 ? `${minutes}分` : ''}`;
};

export function replaceTemplateVariables(
  template: string,
  startDate: Date,
  customVariables: Record<string, string>
): string {
  return template.replace(
    /%\{([a-zA-Z_]+)(?::([+-]\d+[ymdh]))?\}/g,
    (match, varName, offset) => {
      // カスタム変数が存在すればそれを優先
      if (customVariables[varName]) {
        return customVariables[varName];
      }

      const date = new Date(startDate);
      // オフセットがあれば日付を計算
      if (offset) {
        const value = parseInt(offset.slice(1, -1), 10);
        const unit = offset.slice(-1);
        switch (unit) {
          case 'y':
            date.setFullYear(date.getFullYear() + value);
            break;
          case 'm':
            date.setMonth(date.getMonth() + value);
            break;
          case 'd':
            date.setDate(date.getDate() + value);
            break;
          case 'h':
            date.setHours(date.getHours() + value);
            break;
        }
      }

      // 標準の変数を置換
      switch (varName) {
        case 'Year':
          return date.getFullYear().toString();
        case 'month':
          return (date.getMonth() + 1).toString().padStart(2, '0');
        case 'day':
          return date.getDate().toString().padStart(2, '0');
        case 'startDate':
          return formatDate(startDate);
        case 'endDate':
          return formatDate(new Date(customVariables.endDate || startDate));
        case 'dateRange':
          return `${formatDate(startDate)} ~ ${formatDate(
            new Date(customVariables.endDate || startDate)
          )}`;
        default:
          return match; // 不明な変数はそのまま返す
      }
    }
  );
}

export function generateWorkTimeText(workTimes: WorkTime[], reportType: ReportType): string {
  if (!workTimes || workTimes.length === 0) return '';

  // MTG資料の場合、日毎の集計と合計時間を記載
  if (reportType === 'meeting') {
    const dailyWork: Record<string, number> = {};
    let totalMinutes = 0;

    workTimes.forEach((wt) => {
      if (wt.end) {
        const start = new Date(wt.start);
        const end = new Date(wt.end);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        if (duration > 0) {
          totalMinutes += duration;
          const dateStr = formatDate(start);
          dailyWork[dateStr] = (dailyWork[dateStr] || 0) + duration;
        }
      }
    });

    if (totalMinutes === 0) {
      return '## 作業時間\n作業記録がありません。';
    }

    const dailyWorkText = Object.entries(dailyWork)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, minutes]) => `- ${date}: ${formatDuration(minutes)}`)
      .join('\n');

    return `## 作業時間
- **期間合計:** ${formatDuration(totalMinutes)}
- **日毎の作業時間:**
${dailyWorkText}`;
  }

  // 日報の場合、各作業時間とメモをリスト形式で記載
  let totalMinutes = 0;
  const workTimeList = workTimes
    .map((wt) => {
      if (wt.end) {
        const start = new Date(wt.start);
        const end = new Date(wt.end);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        totalMinutes += duration;
        const startTime = start.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const endTime = end.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        });
        let text = `- ${startTime}〜${endTime}（${formatDuration(duration)}）`;
        if (wt.memo) text += `\n  - メモ: ${wt.memo.replace(/\n/g, '\n    ')}`;
        return text;
      }
      return null;
    })
    .filter(Boolean);

  if (workTimeList.length > 0) {
    return `# 作業時間\n- 合計: ${formatDuration(totalMinutes)}\n${workTimeList.join('\n')}`;
  }
  return '';
}
