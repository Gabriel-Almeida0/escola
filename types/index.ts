export interface Student {
  id: string;
  name: string;
  class: string;
  photo?: string;
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  studentId: string;
  date: string;
  hadLunch: boolean;
  hadDinner: boolean;
  extraHours: number;
  updatedAt: string;
}

export interface MonthlyReport {
  studentId: string;
  studentName: string;
  class: string;
  totalLunches: number;
  totalDinners: number;
  totalExtraHours: number;
}

export type RecordStatus = 'lunch' | 'dinner' | 'both' | 'none';