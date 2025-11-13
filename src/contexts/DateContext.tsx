// src/contexts/DateContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import type { ReportType } from "@/types/report";

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

export function DateProvider({ children, reportType }: DateProviderProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (reportType === "daily") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStartDate(today);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      setEndDate(endOfDay);
    } else {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7); // 7日前からの7日間
      sevenDaysAgo.setHours(0, 0, 0, 0);
      setStartDate(sevenDaysAgo);
      
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      setEndDate(endOfToday);
    }
  }, [reportType]);

  const value = { startDate, setStartDate, endDate, setEndDate };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useDateContext(): DateContextType {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error("useDateContext must be used within a DateProvider");
  }
  return context;
}
