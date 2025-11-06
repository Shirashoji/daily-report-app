export const formatDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDatesInWeek = (date: Date) => {
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const targetJstDate = new Date(date.getTime() + jstOffsetMs);

  const startOfWeekJst = new Date(targetJstDate);
  startOfWeekJst.setUTCDate(targetJstDate.getUTCDate() - (targetJstDate.getUTCDay() === 0 ? 6 : targetJstDate.getUTCDay() - 1));
  startOfWeekJst.setUTCHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeekJst);
    d.setUTCDate(startOfWeekJst.getUTCDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
};

export const formatWorkTime = (time: Date) => {
  return time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};
