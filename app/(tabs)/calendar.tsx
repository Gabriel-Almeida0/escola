import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { ArrowLeft } from 'lucide-react-native';
import { Student, DailyRecord } from '@/types';
import { StorageService } from '@/services/storage';
import { getTodayString, formatDisplayDate } from '@/utils/dateUtils';
import RecordCard from '@/components/RecordCard';

export default function CalendarScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showDateRecords, setShowDateRecords] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadRecordsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const studentsData = await StorageService.getStudents();
      setStudents(studentsData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecordsForDate = async (date: string) => {
    try {
      await StorageService.initializeRecordsForDate(date);
      const recordsData = await StorageService.getRecordsByDate(date);
      setRecords(recordsData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os registros');
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setShowDateRecords(true);
  };

  const handleUpdateRecord = async (updatedRecord: DailyRecord) => {
    try {
      await StorageService.updateRecord(updatedRecord);
      setRecords(prev =>
        prev.map(record =>
          record.id === updatedRecord.id ? updatedRecord : record
        )
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o registro');
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark today
    const today = getTodayString();
    marked[today] = {
      marked: true,
      dotColor: '#2563EB',
    };
    
    // Mark selected date
    if (selectedDate && selectedDate !== today) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#2563EB',
      };
    } else if (selectedDate === today) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#2563EB',
        marked: true,
        dotColor: '#FFFFFF',
      };
    }
    
    return marked;
  };

  const goBackToCalendar = () => {
    setShowDateRecords(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showDateRecords) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBackToCalendar}>
            <ArrowLeft size={24} color="#2563EB" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Registros do Dia</Text>
            <Text style={styles.subtitle}>{formatDisplayDate(selectedDate)}</Text>
          </View>
        </View>

        <ScrollView style={styles.recordsList}>
          {students.map(student => {
            const record = records.find(r => r.studentId === student.id);
            if (!record) return null;

            return (
              <RecordCard
                key={student.id}
                student={student}
                record={record}
                onUpdateRecord={handleUpdateRecord}
              />
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendário de Registros</Text>
        <Text style={styles.subtitle}>Selecione uma data para ver os registros</Text>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#6B7280',
            selectedDayBackgroundColor: '#2563EB',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#2563EB',
            dayTextColor: '#1F2937',
            textDisabledColor: '#D1D5DB',
            dotColor: '#2563EB',
            selectedDotColor: '#FFFFFF',
            arrowColor: '#2563EB',
            monthTextColor: '#1F2937',
            indicatorColor: '#2563EB',
          }}
          style={styles.calendar}
        />
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Como usar:</Text>
        <Text style={styles.instructionsText}>
          • Toque em uma data para ver e editar os registros daquele dia
        </Text>
        <Text style={styles.instructionsText}>
          • O ponto azul indica o dia atual
        </Text>
        <Text style={styles.instructionsText}>
          • Você pode editar registros de qualquer data
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: 12,
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 24,
  },
  recordsList: {
    flex: 1,
    paddingTop: 8,
  },
});