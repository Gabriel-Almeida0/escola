import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, FileText, Calendar, Users } from 'lucide-react-native';
import { MonthlyReport } from '@/types';
import { ReportService, getReports } from '@/services/reportService';
import { getMonthName } from '@/utils/dateUtils';

export default function ReportsScreen() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [page, setPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      const fetched = await getReports({}, 10 * page); // Limite progressivo para paginação
      setReports(fetched);
    };
    loadReports();
  }, [page]);

  const generateReport = async () => {
    try {
      setIsLoading(true);
      const report = await ReportService.generateMonthlyReport(selectedYear, selectedMonth);
      setReports(report);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      if (reports.length === 0) {
        Alert.alert('Aviso', 'Nenhum dado para exportar');
        return;
      }

      await ReportService.exportToExcel(reports, selectedYear, selectedMonth);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar o relatório');
    }
  };

  const getTotalLunches = () => {
    return reports.reduce((sum, item) => sum + item.totalLunches, 0);
  };

  const getTotalDinners = () => {
    return reports.reduce((sum, item) => sum + item.totalDinners, 0);
  };

  const getTotalExtraHours = () => {
    return reports.reduce((sum, item) => sum + item.totalExtraHours, 0);
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios Mensais</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>Exportar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => changeMonth(-1)}
        >
          <Text style={styles.monthButtonText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.monthInfo}>
          <Text style={styles.monthText}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => changeMonth(1)}
        >
          <Text style={styles.monthButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Users size={24} color="#2563EB" />
          <Text style={styles.summaryNumber}>{reports.length}</Text>
          <Text style={styles.summaryLabel}>Alunos</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <FileText size={24} color="#16A34A" />
          <Text style={styles.summaryNumber}>{getTotalLunches()}</Text>
          <Text style={styles.summaryLabel}>Almoços</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <FileText size={24} color="#EA580C" />
          <Text style={styles.summaryNumber}>{getTotalDinners()}</Text>
          <Text style={styles.summaryLabel}>Jantares</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Calendar size={24} color="#8B5CF6" />
          <Text style={styles.summaryNumber}>{getTotalExtraHours()}</Text>
          <Text style={styles.summaryLabel}>Horas Extras</Text>
        </View>
      </View>

      <ScrollView style={styles.reportContainer}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Detalhes por Aluno</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando relatório...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum dado encontrado para este mês</Text>
          </View>
        ) : (
          <View style={styles.reportTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.nameColumn]}>Nome</Text>
              <Text style={[styles.tableHeaderText, styles.classColumn]}>Turma</Text>
              <Text style={[styles.tableHeaderText, styles.numberColumn]}>Almoços</Text>
              <Text style={[styles.tableHeaderText, styles.numberColumn]}>Jantares</Text>
              <Text style={[styles.tableHeaderText, styles.numberColumn]}>H. Extras</Text>
            </View>

            {reports.map((item, index) => (
              <View key={item.studentId} style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
                <Text style={[styles.tableCell, styles.nameColumn]}>{item.studentName}</Text>
                <Text style={[styles.tableCell, styles.classColumn]}>{item.class}</Text>
                <Text style={[styles.tableCell, styles.numberColumn]}>{item.totalLunches}</Text>
                <Text style={[styles.tableCell, styles.numberColumn]}>{item.totalDinners}</Text>
                <Text style={[styles.tableCell, styles.numberColumn]}>{item.totalExtraHours}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  exportButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  monthSelector: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthButton: {
    backgroundColor: '#F3F4F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  monthInfo: {
    marginHorizontal: 24,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  reportContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  reportHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  reportTable: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  evenRow: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 14,
    color: '#1F2937',
  },
  nameColumn: {
    flex: 2,
  },
  classColumn: {
    flex: 1,
  },
  numberColumn: {
    flex: 1,
    textAlign: 'center',
  },
});