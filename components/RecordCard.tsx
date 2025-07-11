import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Minus, Utensils, Clock } from 'lucide-react-native';
import { Student, DailyRecord } from '@/types';
import StudentCard from './StudentCard';

interface RecordCardProps {
  student: Student;
  record: DailyRecord;
  onUpdateRecord: (record: DailyRecord) => void;
}

export default function RecordCard({ student, record, onUpdateRecord }: RecordCardProps) {
  const toggleLunch = () => {
    onUpdateRecord({
      ...record,
      hadLunch: !record.hadLunch,
      updatedAt: new Date().toISOString()
    });
  };

  const toggleDinner = () => {
    onUpdateRecord({
      ...record,
      hadDinner: !record.hadDinner,
      updatedAt: new Date().toISOString()
    });
  };

  const updateExtraHours = (delta: number) => {
    const newHours = Math.max(0, Math.min(5, record.extraHours + delta));
    onUpdateRecord({
      ...record,
      extraHours: newHours,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <View style={styles.container}>
      <StudentCard student={student} showClass={false} />
      
      <View style={styles.controlsContainer}>
        <View style={styles.mealControls}>
          <TouchableOpacity
            style={[styles.mealButton, record.hadLunch && styles.activeMealButton]}
            onPress={toggleLunch}
          >
            <Utensils size={20} color={record.hadLunch ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.mealButtonText, record.hadLunch && styles.activeMealButtonText]}>
              Almoço
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.mealButton, record.hadDinner && styles.activeMealButton]}
            onPress={toggleDinner}
          >
            <Utensils size={20} color={record.hadDinner ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.mealButtonText, record.hadDinner && styles.activeMealButtonText]}>
              Jantar
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.hoursContainer}>
          <Clock size={20} color="#6B7280" />
          <Text style={styles.hoursLabel}>Horas Extras:</Text>
          <View style={styles.hoursControls}>
            <TouchableOpacity
              style={styles.hoursButton}
              onPress={() => updateExtraHours(-1)}
            >
              <Minus size={16} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.hoursValue}>{record.extraHours}</Text>
            <TouchableOpacity
              style={styles.hoursButton}
              onPress={() => updateExtraHours(1)}
            >
              <Plus size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  mealControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  activeMealButton: {
    backgroundColor: '#16A34A',
  },
  mealButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeMealButtonText: {
    color: '#FFFFFF',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  hoursControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  hoursValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
});