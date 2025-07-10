import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, CreditCard as Edit2, Trash2, X } from 'lucide-react-native';
import { Student } from '@/types';
import { StorageService } from '@/services/storage';
import StudentCard from '@/components/StudentCard';
import { saveData, fetchData } from '@/services/firebase';

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    photo: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      const fetched = await fetchData('students', {}, 50); // Limite para minimizar
      setStudents(fetched);
    };
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchText]);

  const filterStudents = () => {
    let filtered = students;

    if (searchText) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.class.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const openAddModal = () => {
    setFormData({ name: '', class: '', photo: '' });
    setEditingStudent(null);
    setShowAddModal(true);
  };

  const openEditModal = (student: Student) => {
    setFormData({
      name: student.name,
      class: student.class,
      photo: student.photo || ''
    });
    setEditingStudent(student);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingStudent(null);
    setFormData({ name: '', class: '', photo: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.class.trim()) {
      Alert.alert('Erro', 'Nome e turma são obrigatórios');
      return;
    }

    try {
      if (editingStudent) {
        const updatedStudent: Student = {
          ...editingStudent,
          name: formData.name.trim(),
          class: formData.class.trim(),
          photo: formData.photo.trim() || undefined
        };
        await StorageService.updateStudent(updatedStudent);
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      } else {
        const newStudent: Student = {
          id: Date.now().toString(),
          name: formData.name.trim(),
          class: formData.class.trim(),
          photo: formData.photo.trim() || undefined,
          createdAt: new Date().toISOString()
        };
        await StorageService.addStudent(newStudent);
        setStudents(prev => [...prev, newStudent]);
      }
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o aluno');
    }
  };

  const handleDelete = (student: Student) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir ${student.name}? Todos os registros deste aluno também serão excluídos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteStudent(student.id);
              setStudents(prev => prev.filter(s => s.id !== student.id));
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o aluno');
            }
          }
        }
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alunos</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou turma..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView style={styles.studentsList}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            </Text>
          </View>
        ) : (
          filteredStudents.map(student => (
            <View key={student.id} style={styles.studentItem}>
              <StudentCard student={student} />
              <View style={styles.studentActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(student)}
                >
                  <Edit2 size={16} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(student)}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingStudent ? 'Editar Aluno' : 'Adicionar Aluno'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Digite o nome do aluno"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Turma *</Text>
              <TextInput
                style={styles.input}
                value={formData.class}
                onChangeText={(text) => setFormData(prev => ({ ...prev, class: text }))}
                placeholder="Digite a turma do aluno"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Foto (URL - opcional)</Text>
              <TextInput
                style={styles.input}
                value={formData.photo}
                onChangeText={(text) => setFormData(prev => ({ ...prev, photo: text }))}
                placeholder="URL da foto do aluno"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  studentsList: {
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
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  studentActions: {
    flexDirection: 'row',
    marginRight: 16,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 0.45,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 0.45,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});