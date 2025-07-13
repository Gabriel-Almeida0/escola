class StorageService {
    // Students
    static async getStudents() {
        try {
            // Garantir que o banco de dados esteja inicializado
            if (typeof initializeDatabase === 'function') {
                await initializeDatabase();
            } else {
                throw new Error("Função initializeDatabase não encontrada");
            }
            
            // Buscar dados
            const students = await fetchData('students', {
                orderBy: ['updatedAt', 'desc']
            }, 1000);
            
            console.log("Alunos carregados do banco de dados local:", students.length);
            return students;
        } catch (error) {
            console.error('Erro ao obter alunos:', error);
            return [];
        }
    }

    static async saveStudents(students) {
        console.log("Função legada saveStudents chamada - sem efeito");
        return true;
    }

    static async addStudent(student) {
        try {
            // Adiciona campos necessários
            const studentToSave = {
                ...student,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Salvar no banco de dados local
            const docId = await saveData('students', studentToSave);
            console.log(`Aluno adicionado com ID: ${docId}`);
            
            // Atualizar o ID do estudante com o ID do documento
            const updatedStudent = { ...studentToSave, id: docId };
            
            return updatedStudent;
        } catch (error) {
            console.error('Erro ao salvar aluno:', error);
            throw error;
        }
    }

    static async updateStudent(updatedStudent) {
        try {
            // Adiciona timestamp de atualização
            const studentToUpdate = {
                ...updatedStudent,
                updatedAt: new Date().toISOString()
            };
            
            // Atualizar no banco de dados local
            await updateData('students', updatedStudent.id, studentToUpdate);
            console.log(`Aluno atualizado: ${updatedStudent.id}`);
            
            return studentToUpdate;
        } catch (error) {
            console.error('Erro ao atualizar aluno:', error);
            throw error;
        }
    }

    static async deleteStudent(studentId) {
        try {
            console.log(`Iniciando exclusão do aluno com ID: ${studentId}`);
            
            if (!studentId) {
                throw new Error("ID de aluno inválido");
            }
            
            // Primeiro, excluir os registros deste aluno
            try {
                console.log(`Buscando registros do aluno ${studentId} para exclusão`);
                const records = await fetchData('daily_records', { where: ['studentId', '==', studentId] }, 1000);
                console.log(`Encontrados ${records.length} registros para o aluno ${studentId}`);
                
                // Excluir cada registro do aluno
                let deletedRecordsCount = 0;
                for (const record of records) {
                    try {
                        await deleteData('daily_records', record.id);
                        console.log(`Registro excluído: ${record.id}`);
                        deletedRecordsCount++;
                    } catch (recordError) {
                        console.error(`Erro ao excluir registro ${record.id}:`, recordError);
                    }
                }
                console.log(`${deletedRecordsCount} de ${records.length} registros excluídos para o aluno ${studentId}`);
            } catch (recordsError) {
                console.warn('Erro ao buscar ou excluir registros do aluno:', recordsError);
                // Continuar com a exclusão do aluno mesmo se houver erro com os registros
            }
            
            // Agora excluir o aluno
            console.log(`Excluindo aluno: ${studentId}`);
            await deleteData('students', studentId);
            console.log(`Aluno excluído com sucesso: ${studentId}`);
            
            return true;
        } catch (error) {
            console.error(`Erro crítico ao excluir aluno ${studentId}:`, error);
            throw error;
        }
    }

    // Daily Records
    static async getRecords() {
        try {
            // Garantir que o banco de dados esteja inicializado
            if (typeof initializeDatabase === 'function') {
                await initializeDatabase();
            } else {
                throw new Error("Função initializeDatabase não encontrada");
            }
            
            // Buscar dados
            const records = await fetchData('daily_records', {
                orderBy: ['date', 'desc']
            }, 1000);
            
            console.log("Registros carregados do banco de dados local:", records.length);
            return records;
        } catch (error) {
            console.error('Erro crítico ao obter registros:', error);
            return [];
        }
    }

    static async saveRecords(records) {
        console.log("Função legada saveRecords chamada - sem efeito");
        return true;
    }

    static async getRecordsByDate(date) {
        try {
            // Garantir que o banco de dados esteja inicializado
            if (typeof initializeDatabase === 'function') {
                await initializeDatabase();
            } else {
                throw new Error("Função initializeDatabase não encontrada");
            }
            
            // Buscar dados filtrados por data
            const records = await fetchData('daily_records', { where: ['date', '==', date] }, 1000);
            console.log(`Registros para a data ${date}:`, records.length);
            return records;
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
            
            // Se já tem ID, atualizar
            if (updatedRecord.id) {
                await updateData('daily_records', updatedRecord.id, recordToUpdate);
                console.log(`Registro atualizado: ${updatedRecord.id}`);
                return recordToUpdate;
            } else {
                // Caso contrário, criar novo
                recordToUpdate.createdAt = new Date().toISOString();
                const docId = await saveData('daily_records', recordToUpdate);
                console.log(`Novo registro criado com ID: ${docId}`);
                return { ...recordToUpdate, id: docId };
            }
        } catch (error) {
            console.error('Erro ao atualizar registro:', error);
            throw error;
        }
    }

    // Inicialização de registros diários
    static async initializeRecordsForDate(date) {
        try {
            console.log(`Inicializando registros para a data ${date}`);
            
            // Buscar todos os alunos
            const allStudents = await this.getStudents();
            
            // Verificar registros existentes para esta data
            const existingRecords = await this.getRecordsByDate(date);
            
            // Para cada aluno, verificar se já tem registro para esta data
            let createdCount = 0;
            for (const student of allStudents) {
                const hasRecord = existingRecords.some(record => record.studentId === student.id);
                
                if (!hasRecord) {
                    // Criar novo registro
                    const newRecord = {
                        studentId: student.id,
                        studentName: student.name,
                        studentClass: student.class,
                        date,
                        hadLunch: false,
                        hadDinner: false,
                        extraHours: 0,
                        isPresent: false,
                        notes: ''
                    };
                    
                    await this.updateRecord(newRecord);
                    createdCount++;
                }
            }
            
            console.log(`${createdCount} novos registros criados para a data ${date}`);
            
            // Buscar os registros atualizados
            return await this.getRecordsByDate(date);
        } catch (error) {
            console.error(`Erro ao inicializar registros para data ${date}:`, error);
            throw error;
        }
    }
}