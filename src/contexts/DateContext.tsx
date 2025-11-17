// src/contexts/DateContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import { toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { ReportType } from '@/types/report';
import type { ReactElement } from 'react';

interface DateContextType {
  startDate: Date;
  setStartDate: Dispatch<SetStateAction<Date>>;
  endDate: Date;
  setEndDate: Dispatch<SetStateAction<Date>>;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

interface DateProviderProps {
  children: ReactNode;
  reportType: ReportType;
}

const timeZone = 'Asia/Tokyo';

export function DateProvider({ children, reportType }: DateProviderProps): ReactElement {
  const nowInJST = toZonedTime(new Date(), timeZone);
  const [startDate, setStartDate] = useState<Date>(nowInJST);
  const [endDate, setEndDate] = useState<Date>(nowInJST);

  useEffect(() => {
    const now = new Date();
    const nowInJST = toZonedTime(now, timeZone);

    if (reportType === 'daily') {
      setStartDate(startOfDay(nowInJST));
      setEndDate(endOfDay(nowInJST));
    } else {
      const sevenDaysAgo = subDays(nowInJST, 7);
      setStartDate(startOfDay(sevenDaysAgo));
      setEndDate(endOfDay(nowInJST));
    }
  }, [reportType]);

  const value = { startDate, setStartDate, endDate, setEndDate };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useDateContext(): DateContextType {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
}
