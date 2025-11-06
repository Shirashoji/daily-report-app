export interface WorkTime {
  start: string;
  end: string | null;
  memo: string;
}

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} ~ ${end}`;
};

export const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0) return "0分";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}時間`;
  }
  if (minutes > 0) {
    result += `${minutes}分`;
  }
  return result;
};

export const replaceTemplateVariables = (
  template: string,
  startDate: Date,
  endDate: Date,
  customVariables: Record<string, string>,
): string => {
  return template.replace(
    /%\{([a-zA-Z_]+)((?:[:+-]?\d+[ymdh])+)?\}/g,
    (match, varName, offsets) => {
      if (customVariables[varName]) {
        return customVariables[varName];
      }

      const date = new Date(startDate); // デフォルトはstartDateを基準とする
      if (offsets) {
        const offsetRegex = /:([+-]?\d+)([ymdh])/g;
        let offsetMatch;
        while ((offsetMatch = offsetRegex.exec(offsets)) !== null) {
          const value = parseInt(offsetMatch, 10); // offsetMatchが数値部分
          const unit = offsetMatch; // offsetMatchが単位部分
          switch (unit) {
            case "y":
              date.setFullYear(date.getFullYear() + value);
              break;
            case "m":
              date.setMonth(date.getMonth() + value);
              break;
            case "d":
              date.setDate(date.getDate() + value);
              break;
            case "h":
              date.setHours(date.getHours() + value);
              break;
          }
        }
      }

      switch (varName) {
        case "Year":
          return date.getFullYear().toString();
        case "month":
          return (date.getMonth() + 1).toString().padStart(2, "0");
        case "day":
          return date.getDate().toString().padStart(2, "0");
        case "startDate":
          return formatDate(startDate);
        case "endDate":
          return formatDate(endDate);
        case "dateRange":
          return formatDateRange(startDate, endDate);
        default:
          return match;
      }
    },
  );
};

export const generateDailyWorkTimeText = (workTimes: WorkTime[]): string => {
  if (!workTimes || workTimes.length === 0) {
    return "";
  }

  let totalMinutes = 0;
  const workTimeList = workTimes
    .map((wt) => {
      if (wt.end) {
        const start = new Date(wt.start);
        const end = new Date(wt.end);
        const duration = Math.round(
          (end.getTime() - start.getTime()) / (1000 * 60),
        );
        totalMinutes += duration;
        const startTime = start.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTime = end.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
        let text = `- ${startTime}〜${endTime}（${formatDuration(duration)}）`;
        if (wt.memo) {
          text += `\n  - メモ: ${wt.memo.replace(/\n/g, "\n    ")}`;
        }
        return text;
      }
      return null;
    })
    .filter((item) => item !== null);

  if (workTimeList.length > 0) {
    let workTimeText = "# 作業時間\n";
    workTimeText += `- 合計: ${formatDuration(totalMinutes)}\n`;
    workTimeText += workTimeList.join("\n");
    return workTimeText;
  }
  return "";
};

export const generateWeeklyWorkTimeText = (
  workTimes: WorkTime[],
  startDate: Date,
  endDate: Date,
): string => {
  if (!workTimes || workTimes.length === 0) {
    return "";
  }

  const totalWeeklyMinutes = workTimes.reduce((total, wt) => {
    if (wt.end) {
      const start = new Date(wt.start);
      const end = new Date(wt.end);
      return total + Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }
    return total;
  }, 0);

  let workTimeText = "## 作業時間\n";
  workTimeText += `${formatDateRange(
    startDate,
    endDate,
  )}の合計作業時間：${formatDuration(totalWeeklyMinutes)}\n`;
  workTimeText += `詳細\n`;

  const groupedByDay: { [key: string]: number } = {};
  workTimes.forEach((wt) => {
    if (wt.end) {
      const date = formatDate(new Date(wt.start));
      const start = new Date(wt.start);
      const end = new Date(wt.end);
      const duration = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60),
      );
      if (!groupedByDay[date]) {
        groupedByDay[date] = 0;
      }
      groupedByDay[date] += duration;
    }
  });

  Object.keys(groupedByDay)
    .sort()
    .forEach((date) => {
      const totalDailyMinutes = groupedByDay[date];
      workTimeText += `- ${date}: ${formatDuration(totalDailyMinutes)}\n`;
    });
  return workTimeText;
};

export const generateWorkTimeText = (
  workTimes: WorkTime[],
  reportType: string,
  startDate: Date,
  endDate: Date,
): string => {
  if (reportType === "meeting") {
    return generateWeeklyWorkTimeText(workTimes, startDate, endDate);
  } else {
    return generateDailyWorkTimeText(workTimes);
  }
};

export const createDailyReportPrompt = (
  template: string,
  workTimeText: string,
  commits: string,
): string => {
  return `以下のテンプレート、作業時間、コミット履歴を元に、日報を完成させてください。
「# 作業内容」のセクションは、コミット履歴と作業時間中のメモを参考に、Markdown形式で具体的に記述してください。
その他のセクション（「# 作業予定」「# note」「# 次回やること」）は空欄のままで構いません。
作業時間は指定されたものをそのまま記載してください。

${template.replace("# 作業予定", `${workTimeText}\n\n# 作業予定`)}

# コミット履歴
---
${commits}
---

# 生成される日報`;
};

export const createMeetingReportPrompt = (
  template: string,
  workTimeText: string,
  commits: string,
  lastMeetingContent?: string,
): string => {
  const lastMeetingPrompt = lastMeetingContent
    ? `
# 先週の議事録
---
${lastMeetingContent}
---

上記の「先週の議事録」の「次回までにやること」セクションの内容を抽出 し、以下のテンプレートの「今回やること」セクションに転記してください。`
    : "";

  return `以下のテンプレート、作業時間、コミット履歴を元に、MTG資料を完成させてください。
「## やったこと」のセクションは、コミット履歴を参考にMarkdown形式で具体的に記述してください。
作業時間は指定されたものをそのまま記載してください。
その他のセクションはテンプレートの記述を維持してください。

${template.replace("## 作業時間", workTimeText)}

# コミット履歴
---
${commits}
---

# 生成されるMTG資料`;
};

export const createPrompt = (
  reportType: string,
  template: string,
  workTimeText: string,
  commits: string,
  lastMeetingContent?: string,
): string => {
  if (reportType === "meeting") {
    return createMeetingReportPrompt(
      template,
      workTimeText,
      commits,
      lastMeetingContent,
    );
  } else {
    return createDailyReportPrompt(template, workTimeText, commits);
  }
};