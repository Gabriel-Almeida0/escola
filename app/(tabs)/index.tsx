import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter, RefreshCw } from 'lucide-react-native';
import { Student, DailyRecord, RecordStatus } from '@/types';
import { StorageService } from '@/services/storage';
import { getTodayString } from '@/utils/dateUtils';
import RecordCard from '@/components/RecordCard';

export default function HomeScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<RecordStatus | 'all'>('all');
  const [classes, setClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayString = getTodayString();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, records, selectedClass, selectedFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const studentsData = await StorageService.getStudents();
      const recordsData = await StorageService.getRecordsByDate(todayString);
      
      // Initialize records for today if they don't exist
      await StorageService.initializeRecordsForDate(todayString);
      const updatedRecords = await StorageService.getRecordsByDate(todayString);
      
      setStudents(studentsData);
      setRecords(updatedRecords);
      
      // Extract unique classes
      const uniqueClasses = [...new Set(studentsData.map(s => s.class))];
      setClasses(uniqueClasses);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by class
    if (selectedClass) {
      filtered = filtered.filter(s => s.class === selectedClass);
    }

    // Filter by meal status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(student => {
        const record = records.find(r => r.studentId === student.id);
        if (!record) return selectedFilter === 'none';
        
        const hadLunch = record.hadLunch;
        const hadDinner = record.hadDinner;
        
        switch (selectedFilter) {
          case 'lunch':
            return hadLunch && !hadDinner;
          case 'dinner':
            return !hadLunch && hadDinner;
          case 'both':
            return hadLunch && hadDinner;
          case 'none':
            return !hadLunch && !hadDinner;
          default:
            return true;
        }
      });
    }

    setFilteredStudents(filtered);
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

  const getFilterButtonStyle = (filter: RecordStatus | 'all') => [
    styles.filterButton,
    selectedFilter === filter && styles.activeFilterButton
  ];

  const getFilterButtonTextStyle = (filter: RecordStatus | 'all') => [
    styles.filterButtonText,
    selectedFilter === filter && styles.activeFilterButtonText
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Registros Diários</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
            <RefreshCw size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Hoje - {new Date().toLocaleDateString('pt-BR')}</Text>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={getFilterButtonStyle('all')}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={getFilterButtonTextStyle('all')}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getFilterButtonStyle('lunch')}
            onPress={() => setSelectedFilter('lunch')}
          >
            <Text style={getFilterButtonTextStyle('lunch')}>Só Almoço</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getFilterButtonStyle('dinner')}
            onPress={() => setSelectedFilter('dinner')}
          >
            <Text style={getFilterButtonTextStyle('dinner')}>Só Jantar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getFilterButtonStyle('both')}
            onPress={() => setSelectedFilter('both')}
          >
            <Text style={getFilterButtonTextStyle('both')}>Ambos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getFilterButtonStyle('none')}
            onPress={() => setSelectedFilter('none')}
          >
            <Text style={getFilterButtonTextStyle('none')}>Nenhum</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.classFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.classFilterButton, !selectedClass && styles.activeClassFilterButton]}
            onPress={() => setSelectedClass('')}
          >
            <Text style={[styles.classFilterButtonText, !selectedClass && styles.activeClassFilterButtonText]}>
              Todas as turmas
            </Text>
          </TouchableOpacity>
          {classes.map(className => (
            <TouchableOpacity
              key={className}
              style={[styles.classFilterButton, selectedClass === className && styles.activeClassFilterButton]}
              onPress={() => setSelectedClass(className)}
            >
              <Text style={[styles.classFilterButtonText, selectedClass === className && styles.activeClassFilterButtonText]}>
                {className}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.recordsList}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum aluno encontrado</Text>
          </View>
        ) : (
          filteredStudents.map(student => {
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
          })
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  refreshButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  classFiltersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  classFilterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeClassFilterButton: {
    backgroundColor: '#16A34A',
  },
  classFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeClassFilterButtonText: {
    color: '#FFFFFF',
  },
  recordsList: {
    flex: 1,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});