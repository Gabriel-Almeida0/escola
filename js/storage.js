class StorageService {
    // Students
    static async getStudents() {
        try {
            try {
                // Verifica se o Firebase está conectado - espera a inicialização
                if (typeof isFirestoreConnected === 'function') {
                    const connected = await isFirestoreConnected();
                    if (!connected) {
                        throw new Error("Firebase não está conectado");
                    }
                } else {
                    throw new Error("Função isFirestoreConnected não encontrada");
                }
                
                // Tenta buscar do Firebase primeiro com opções aprimoradas
                const students = await fetchData('students', {
                    orderBy: ['updatedAt', 'desc']
                }, 1000);
                console.log("Alunos carregados do Firebase:", students.length);
                
                // Salva no localStorage como backup
                if (students.length > 0) {
                    localStorage.setItem('students', JSON.stringify(students));
                    localStorage.setItem('students_last_sync', new Date().toISOString());
                }
                
                return students;
            } catch (firebaseError) {
                console.warn('Erro ao buscar alunos do Firebase, usando localStorage:', firebaseError);
                // Fallback para localStorage
                const studentsJson = localStorage.getItem('students');
                const students = studentsJson ? JSON.parse(studentsJson) : [];
                console.log(`Usando ${students.length} alunos do cache local`);
                return students;
            }
        } catch (error) {
            console.error('Erro crítico ao obter alunos:', error);
            return [];
        }
    }

    static async saveStudents(students) {
        try {
            localStorage.setItem('students', JSON.stringify(students));
            localStorage.setItem('students_last_sync', new Date().toISOString());
        } catch (error) {
            console.error('Erro ao salvar alunos no localStorage:', error);
        }
    }

    static async addStudent(student) {
        try {
            // Adiciona campos necessários
            const studentToSave = {
                ...student,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Tenta salvar no Firebase
            const docId = await saveData('students', studentToSave);
            console.log(`Aluno adicionado com ID: ${docId}`);
            
            // Atualizar o ID do estudante com o ID do documento do Firestore
            const updatedStudent = { ...studentToSave, id: docId };
            
            // Atualiza o cache local também
            const students = await this.getStudents();
            const newStudents = [...students, updatedStudent];
            await this.saveStudents(newStudents);
            
            return updatedStudent;
        } catch (firebaseError) {
            console.warn('Erro ao salvar aluno no Firebase, usando apenas localStorage:', firebaseError);
            
            // Gera um ID local
            const localId = 'local_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 9);
            const studentWithId = { ...student, id: localId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            
            // Fallback para localStorage
            const students = await this.getStudents();
            students.push(studentWithId);
            await this.saveStudents(students);
            
            return studentWithId;
        }
    }

    static async updateStudent(updatedStudent) {
        try {
            // Adiciona timestamp de atualização
            const studentToUpdate = {
                ...updatedStudent,
                updatedAt: new Date().toISOString()
            };
            
            // Tenta atualizar no Firebase
            if (updatedStudent.id && !updatedStudent.id.startsWith('local_')) {
                await updateData('students', updatedStudent.id, studentToUpdate);
                console.log(`Aluno atualizado no Firebase: ${updatedStudent.id}`);
                
                // Atualiza o cache local também
                const students = await this.getStudents();
                const index = students.findIndex(s => s.id === updatedStudent.id);
                if (index !== -1) {
                    students[index] = studentToUpdate;
                    await this.saveStudents(students);
                }
                
                return studentToUpdate;
            } else {
                throw new Error("ID inválido ou local");
            }
        } catch (firebaseError) {
            console.warn('Erro ao atualizar aluno no Firebase, usando localStorage:', firebaseError);
            // Fallback para localStorage
            const students = await this.getStudents();
            const index = students.findIndex(s => s.id === updatedStudent.id);
            if (index !== -1) {
                students[index] = {
                    ...updatedStudent,
                    updatedAt: new Date().toISOString()
                };
                await this.saveStudents(students);
            }
            return updatedStudent;
        }
    }

    static async deleteStudent(studentId) {
        try {
            // Verifica se é um ID local
            if (studentId.startsWith('local_')) {
                throw new Error("ID local, usando apenas localStorage");
            }
            
            // Tenta excluir do Firebase
            await deleteData('students', studentId);
            console.log(`Aluno excluído do Firebase: ${studentId}`);
            
            // Também excluir os registros deste aluno
            try {
                const records = await fetchData('daily_records', { where: ['studentId', '==', studentId] }, 1000);
                
                // Excluir cada registro do aluno
                for (const record of records) {
                    await deleteData('daily_records', record.id);
                    console.log(`Registro excluído: ${record.id}`);
                }
            } catch (error) {
                console.warn('Erro ao excluir registros do aluno:', error);
            }
            
            // Atualiza o cache local também
            const students = await this.getStudents();
            const filtered = students.filter(s => s.id !== studentId);
            await this.saveStudents(filtered);
            
            return true;
        } catch (firebaseError) {
            console.warn('Erro ao excluir aluno do Firebase, usando localStorage:', firebaseError);
            // Fallback para localStorage
            const students = await this.getStudents();
            const filtered = students.filter(s => s.id !== studentId);
            await this.saveStudents(filtered);
            
            // Também exclui todos os registros deste aluno
            const records = await this.getRecords();
            const filteredRecords = records.filter(r => r.studentId !== studentId);
            await this.saveRecords(filteredRecords);
            return true;
        }
    }

    // Daily Records
    static async getRecords() {
        try {
            try {
                // Verifica se o Firebase está conectado - espera a inicialização
                if (typeof isFirestoreConnected === 'function') {
                    const connected = await isFirestoreConnected();
                    if (!connected) {
                        throw new Error("Firebase não está conectado");
                    }
                } else {
                    throw new Error("Função isFirestoreConnected não encontrada");
                }
                
                // Tenta buscar do Firebase primeiro
                const records = await fetchData('daily_records', {
                    orderBy: ['date', 'desc']
                }, 1000);
                console.log("Registros carregados do Firebase:", records.length);
                
                // Salva no localStorage como backup
                if (records.length > 0) {
                    localStorage.setItem('daily_records', JSON.stringify(records));
                    localStorage.setItem('records_last_sync', new Date().toISOString());
                }
                
                return records;
            } catch (firebaseError) {
                console.warn('Erro ao buscar registros do Firebase, usando localStorage:', firebaseError);
                // Fallback para localStorage
                const recordsJson = localStorage.getItem('daily_records');
                const records = recordsJson ? JSON.parse(recordsJson) : [];
                console.log(`Usando ${records.length} registros do cache local`);
                return records;
            }
        } catch (error) {
            console.error('Erro crítico ao obter registros:', error);
            return [];
        }
    }

    static async saveRecords(records) {
        try {
            localStorage.setItem('daily_records', JSON.stringify(records));
            localStorage.setItem('records_last_sync', new Date().toISOString());
        } catch (error) {
            console.error('Erro ao salvar registros no localStorage:', error);
        }
    }

    static async getRecordsByDate(date) {
        try {
            try {
                // Verifica se o Firebase está conectado - espera a inicialização
                if (typeof isFirestoreConnected === 'function') {
                    const connected = await isFirestoreConnected();
                    if (!connected) {
                        throw new Error("Firebase não está conectado");
                    }
                } else {
                    throw new Error("Função isFirestoreConnected não encontrada");
                }
                
                // Tenta buscar do Firebase primeiro
                const records = await fetchData('daily_records', { where: ['date', '==', date] }, 1000);
                console.log(`Registros para a data ${date}:`, records.length);
                return records;
            } catch (firebaseError) {
                console.warn('Erro ao buscar registros por data do Firebase, usando localStorage:', firebaseError);
                // Fallback para localStorage
                const records = await this.getRecords();
                return records.filter(r => r.date === date);
            }
        } catch (error) {
            console.error(`Erro crítico ao obter registros para data ${date}:`, error);
            return [];
        }
    }

    static async updateRecord(updatedRecord) {
        try {
            // Adiciona timestamp de atualização
            const recordToUpdate = {
                ...updatedRecord,
                updatedAt: new Date().toISOString()
            };
            
            // Tenta atualizar no Firebase
            if (updatedRecord.id && !updatedRecord.id.includes('-')) {
                // Se já tem ID do Firebase, atualiza o documento existente
                await updateData('daily_records', updatedRecord.id, recordToUpdate);
                console.log(`Registro atualizado no Firebase: ${updatedRecord.id}`);
                return recordToUpdate;
            } else if (updatedRecord.id && updatedRecord.id.includes('-')) {
                // Se tem ID composto (local), cria um novo documento
                const docId = await saveData('daily_records', recordToUpdate);
                console.log(`Registro local convertido para Firebase com ID: ${docId}`);
                return { ...recordToUpdate, id: docId };
            } else {
                // Se não tem ID, cria um novo documento
                const docId = await saveData('daily_records', recordToUpdate);
                console.log(`Novo registro criado com ID: ${docId}`);
                return { ...recordToUpdate, id: docId };
            }
        } catch (firebaseError) {
            console.warn('Erro ao atualizar registro no Firebase, usando localStorage:', firebaseError);
            // Fallback para localStorage
            const records = await this.getRecords();
            const index = records.findIndex(r => r.id === updatedRecord.id);
            const recordWithTimestamp = {
                ...updatedRecord,
                updatedAt: new Date().toISOString()
            };
            
            if (index !== -1) {
                records[index] = recordWithTimestamp;
            } else {
                // Se não encontrou pelo ID, pode ser um novo registro
                // ou pode ser que o ID seja composto (local)
                const composedIndex = records.findIndex(r => 
                    r.studentId === updatedRecord.studentId && 
                    r.date === updatedRecord.date
                );
                
                if (composedIndex !== -1) {
                    records[composedIndex] = recordWithTimestamp;
                } else {
                    records.push(recordWithTimestamp);
                }
            }
            
            await this.saveRecords(records);
            return recordWithTimestamp;
        }
    }

    static async initializeRecordsForDate(date) {
        const students = await this.getStudents();
        const existingRecords = await this.getRecordsByDate(date);
        
        console.log(`Inicializando registros para ${date}. Alunos: ${students.length}, Registros existentes: ${existingRecords.length}`);
        
        const initializationPromises = [];
        
        for (const student of students) {
            const existingRecord = existingRecords.find(r => r.studentId === student.id);
            if (!existingRecord) {
                const newRecord = {
                    studentId: student.id,
                    date,
                    hadLunch: false,
                    hadDinner: false,
                    extraHours: 0,
                    updatedAt: new Date().toISOString()
                };
                
                // Para compatibilidade com o localStorage, definimos um ID customizado
                // Isso será substituído pelo ID do Firestore após salvar
                newRecord.id = `${student.id}-${date}`;
                
                // Armazena as promessas para execução em paralelo
                initializationPromises.push(this.updateRecord(newRecord));
            }
        }
        
        // Aguarda todas as operações terminarem
        if (initializationPromises.length > 0) {
            await Promise.all(initializationPromises);
        }
        
        console.log(`Inicialização de registros para ${date} concluída.`);
    }
}