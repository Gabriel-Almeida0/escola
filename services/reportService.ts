import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Student, DailyRecord, MonthlyReport } from '@/types';
import { StorageService } from './storage';
import { saveData, fetchData } from './firebase';

// Função para salvar relatório
export const saveReport = async (report) => {
  return saveData('reports', report);
};

// Função para buscar relatórios (com limite e filtro opcional)
export const getReports = async (filter = {}, limitNum = 20) => {
  return fetchData('reports', { where: filter.where }, limitNum);
};

export class ReportService {
  static async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport[]> {
    const students = await StorageService.getStudents();
    const records = await StorageService.getRecords();
    
    const monthStr = month.toString().padStart(2, '0');
    const datePrefix = `${year}-${monthStr}`;
    
    const monthlyRecords = records.filter(r => r.date.startsWith(datePrefix));
    
    const report: MonthlyReport[] = students.map(student => {
      const studentRecords = monthlyRecords.filter(r => r.studentId === student.id);
      
      return {
        studentId: student.id,
        studentName: student.name,
        class: student.class,
        totalLunches: studentRecords.filter(r => r.hadLunch).length,
        totalDinners: studentRecords.filter(r => r.hadDinner).length,
        totalExtraHours: studentRecords.reduce((sum, r) => sum + r.extraHours, 0)
      };
    });
    
    return report;
  }

  static async exportToExcel(report: MonthlyReport[], year: number, month: number): Promise<void> {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const monthName = monthNames[month - 1];
    const filename = `relatorio_${monthName}_${year}.csv`;
    
    // Create CSV content
    let csvContent = 'Nome,Turma,Almoços,Jantares,Horas Extras\n';
    
    report.forEach(item => {
      csvContent += `${item.studentName},${item.class},${item.totalLunches},${item.totalDinners},${item.totalExtraHours}\n`;
    });
    
    // Write to file
    const fileUri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, csvContent);
    
    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  }
}