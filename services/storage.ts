import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, DailyRecord } from '@/types';

const STUDENTS_KEY = 'students';
const RECORDS_KEY = 'daily_records';

export class StorageService {
  // Students
  static async getStudents(): Promise<Student[]> {
    try {
      const studentsJson = await AsyncStorage.getItem(STUDENTS_KEY);
      return studentsJson ? JSON.parse(studentsJson) : [];
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  static async saveStudents(students: Student[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    } catch (error) {
      console.error('Error saving students:', error);
    }
  }

  static async addStudent(student: Student): Promise<void> {
    const students = await this.getStudents();
    students.push(student);
    await this.saveStudents(students);
  }

  static async updateStudent(updatedStudent: Student): Promise<void> {
    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
      students[index] = updatedStudent;
      await this.saveStudents(students);
    }
  }

  static async deleteStudent(studentId: string): Promise<void> {
    const students = await this.getStudents();
    const filtered = students.filter(s => s.id !== studentId);
    await this.saveStudents(filtered);
    
    // Also delete all records for this student
    const records = await this.getRecords();
    const filteredRecords = records.filter(r => r.studentId !== studentId);
    await this.saveRecords(filteredRecords);
  }

  // Daily Records
  static async getRecords(): Promise<DailyRecord[]> {
    try {
      const recordsJson = await AsyncStorage.getItem(RECORDS_KEY);
      return recordsJson ? JSON.parse(recordsJson) : [];
    } catch (error) {
      console.error('Error getting records:', error);
      return [];
    }
  }

  static async saveRecords(records: DailyRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving records:', error);
    }
  }

  static async getRecordsByDate(date: string): Promise<DailyRecord[]> {
    const records = await this.getRecords();
    return records.filter(r => r.date === date);
  }

  static async updateRecord(updatedRecord: DailyRecord): Promise<void> {
    const records = await this.getRecords();
    const index = records.findIndex(r => r.id === updatedRecord.id);
    if (index !== -1) {
      records[index] = updatedRecord;
    } else {
      records.push(updatedRecord);
    }
    await this.saveRecords(records);
  }

  static async initializeRecordsForDate(date: string): Promise<void> {
    const students = await this.getStudents();
    const existingRecords = await this.getRecordsByDate(date);
    const records = await this.getRecords();

    for (const student of students) {
      const existingRecord = existingRecords.find(r => r.studentId === student.id);
      if (!existingRecord) {
        const newRecord: DailyRecord = {
          id: `${student.id}-${date}`,
          studentId: student.id,
          date,
          hadLunch: false,
          hadDinner: false,
          extraHours: 0,
          updatedAt: new Date().toISOString()
        };
        records.push(newRecord);
      }
    }

    await this.saveRecords(records);
  }
}