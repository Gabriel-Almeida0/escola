import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { User } from 'lucide-react-native';
import { Student } from '@/types';

interface StudentCardProps {
  student: Student;
  onPress?: () => void;
  showClass?: boolean;
}

export default function StudentCard({ student, onPress, showClass = true }: StudentCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.photoContainer}>
        {student.photo ? (
          <Image source={{ uri: student.photo }} style={styles.photo} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <User size={24} color="#9CA3AF" />
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{student.name}</Text>
        {showClass && <Text style={styles.class}>{student.class}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoContainer: {
    marginRight: 12,
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  class: {
    fontSize: 14,
    color: '#6B7280',
  },
});