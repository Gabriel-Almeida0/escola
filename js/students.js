document.addEventListener('DOMContentLoaded', function() {
    const studentsList = document.getElementById('studentsList');
    const searchInput = document.getElementById('searchInput');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const studentModal = document.getElementById('studentModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveStudentBtn = document.getElementById('saveStudentBtn');
    const studentForm = document.getElementById('studentForm');
    const studentNameInput = document.getElementById('studentName');
    const studentClassInput = document.getElementById('studentClass');
    const studentPhotoInput = document.getElementById('studentPhoto');
    const modalTitle = document.querySelector('.modal-title');
    const emptyContainer = document.querySelector('.empty-container');
    
    let students = [];
    let filteredStudents = [];
    let editingStudentId = null;
    
    // Garantir que o modal comece oculto
    studentModal.classList.add('hidden');
    studentModal.style.display = 'none';
    
    // Load students
    loadStudents();
    
    // Event listeners
    searchInput.addEventListener('input', filterStudents);
    addStudentBtn.addEventListener('click', openAddModal);
    
    // Event listener para o campo de turma - remover espaços e converter para maiúsculas
    studentClassInput.addEventListener('input', function() {
        // Remove espaços e converte para maiúsculas
        this.value = this.value.replace(/\s+/g, '').toUpperCase();
    });
    
    // Solução direta para o botão de fechar modal
    closeModalBtn.onclick = function() {
        studentModal.style.display = 'none';
        studentModal.classList.add('hidden');
        editingStudentId = null;
        return false;
    };
    
    // Solução direta para o botão cancelar
    cancelBtn.onclick = function() {
        studentModal.style.display = 'none';
        studentModal.classList.add('hidden');
        editingStudentId = null;
        return false;
    };
    
    // Fechar modal quando clicar no backdrop (fora da área do modal)
    studentModal.addEventListener('click', function(event) {
        if (event.target === studentModal) {
            studentModal.style.display = 'none';
            studentModal.classList.add('hidden');
            editingStudentId = null;
        }
    });
    
    saveStudentBtn.addEventListener('click', saveStudent);
    
    async function loadStudents() {
        try {
            studentsList.innerHTML = '<div class="loading-container"><p>Carregando...</p></div>';
            
            students = await StorageService.getStudents();
            filteredStudents = [...students];
            
            renderStudents();
        } catch (error) {
            console.error('Error loading students:', error);
            showError('Não foi possível carregar os alunos', 'Erro');
            studentsList.innerHTML = '<div class="error-container"><p>Erro ao carregar alunos</p></div>';
        }
    }
    
    function filterStudents() {
        const searchText = searchInput.value.toLowerCase();
        
        filteredStudents = students.filter(student =>
            student.name.toLowerCase().includes(searchText) ||
            student.class.toLowerCase().includes(searchText)
        );
        
        renderStudents();
    }
    
    function renderStudents() {
        if (filteredStudents.length === 0) {
            studentsList.innerHTML = '';
            emptyContainer.classList.remove('hidden');
            emptyContainer.querySelector('p').textContent = 
                searchInput.value ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado';
        } else {
            emptyContainer.classList.add('hidden');
            
            let studentsHTML = '';
            filteredStudents.forEach(student => {
                studentsHTML += `
                    <div class="student-item">
                        <div class="student-card">
                            <div class="photo-container">
                                <div class="student-photo">
                                    ${student.photo 
                                        ? `<img src="${student.photo}" alt="${student.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` 
                                        : `<i class="fas fa-user"></i>`
                                    }
                                </div>
                            </div>
                            <div class="student-info">
                                <div class="student-name">${student.name}</div>
                                <div class="student-class">${student.class}</div>
                            </div>
                        </div>
                        <div class="student-actions">
                            <button class="edit-button" data-id="${student.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-button" data-id="${student.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            studentsList.innerHTML = studentsHTML;
            
            // Add event listeners to action buttons
            document.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', function() {
                    const studentId = this.getAttribute('data-id');
                    openEditModal(studentId);
                });
            });
            
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', function() {
                    const studentId = this.getAttribute('data-id');
                    confirmDelete(studentId);
                });
            });
        }
    }
    
    function openAddModal() {
        modalTitle.textContent = 'Adicionar Aluno';
        studentNameInput.value = '';
        studentClassInput.value = '';
        studentPhotoInput.value = '';
        editingStudentId = null;
        studentModal.style.display = 'flex';
        studentModal.classList.remove('hidden');
    }
    
    function openEditModal(studentId) {
        const student = students.find(s => s.id === studentId);
        if (student) {
            modalTitle.textContent = 'Editar Aluno';
            studentNameInput.value = student.name;
            studentClassInput.value = student.class;
            studentPhotoInput.value = student.photo || '';
            editingStudentId = studentId;
            studentModal.style.display = 'flex';
            studentModal.classList.remove('hidden');
        }
    }
    
    function closeModal() {
        // Solução direta similar à implementada nos botões
        studentModal.style.display = 'none';
        studentModal.classList.add('hidden');
        editingStudentId = null;
        // Limpar os campos do formulário para evitar dados residuais
        studentNameInput.value = '';
        studentClassInput.value = '';
        studentPhotoInput.value = '';
    }
    
    async function saveStudent() {
        const name = studentNameInput.value.trim();
        const className = studentClassInput.value.trim().replace(/\s+/g, '').toUpperCase();
        const photo = studentPhotoInput.value.trim();
        
        if (!name || !className) {
            showError('Nome e turma são obrigatórios', 'Campos obrigatórios');
            return;
        }
        
        try {
            if (editingStudentId) {
                // Edit existing student
                const student = students.find(s => s.id === editingStudentId);
                if (student) {
                    const updatedStudent = {
                        ...student,
                        name: name,
                        class: className,
                        photo: photo || undefined
                    };
                    
                    await StorageService.updateStudent(updatedStudent);
                    
                    // Update students array
                    const index = students.findIndex(s => s.id === editingStudentId);
                    students[index] = updatedStudent;
                }
            } else {
                // Add new student
                const newStudent = {
                    id: Date.now().toString(),
                    name: name,
                    class: className,
                    photo: photo || undefined,
                    createdAt: new Date().toISOString()
                };
                
                await StorageService.addStudent(newStudent);
                
                // Update students array
                students.push(newStudent);
            }
            
            // Update filtered students and render
            filterStudents();
            closeModal();
            showSuccess('Aluno salvo com sucesso!');
        } catch (error) {
            console.error('Error saving student:', error);
            showError('Não foi possível salvar o aluno', 'Erro');
        }
    }
    
    function confirmDelete(studentId) {
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        
        showConfirm(
            `Tem certeza que deseja excluir ${student.name}? Todos os registros deste aluno também serão excluídos.`,
            'Confirmar exclusão',
            () => {
                deleteStudent(studentId);
            }
        );
    }
    
    async function deleteStudent(studentId) {
        try {
            console.log(`Iniciando processo de exclusão do aluno: ${studentId}`);
            
            // Mostrar notificação de carregamento
            const loadingNotification = showInfo('Excluindo aluno e seus registros...', 'Processando', 0);
            
            await StorageService.deleteStudent(studentId);
            
            // Remover notificação de carregamento
            if (loadingNotification && loadingNotification.parentNode) {
                loadingNotification.classList.remove('show');
                setTimeout(() => {
                    if (loadingNotification.parentNode) {
                        loadingNotification.remove();
                    }
                }, 300);
            }
            
            // Update students array
            students = students.filter(s => s.id !== studentId);
            
            // Update filtered students and render
            filterStudents();
            showSuccess('Aluno excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir aluno:', error);
            
            // Mensagem de erro mais específica
            let errorMessage = 'Não foi possível excluir o aluno';
            if (error.message) {
                if (error.message.includes('ID inválido')) {
                    errorMessage = 'ID do aluno inválido ou não encontrado';
                } else if (error.message.includes('acesso negado') || error.message.includes('permission')) {
                    errorMessage = 'Sem permissão para excluir este aluno';
                } else if (error.message.includes('conexão') || error.message.includes('connection')) {
                    errorMessage = 'Erro de conexão ao tentar excluir o aluno';
                }
            }
            
            showError(errorMessage, 'Erro na exclusão');
        }
    }
});