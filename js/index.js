document.addEventListener('DOMContentLoaded', function() {
    const recordsList = document.getElementById('recordsList');
    const currentDateElement = document.getElementById('currentDate');
    const refreshButton = document.getElementById('refreshButton');
    const todayButton = document.getElementById('todayButton');
    const dateSelector = document.getElementById('dateSelector');
    const emptyContainer = document.querySelector('.empty-container');
    const notificationContainer = document.getElementById('notificationContainer');
    
    // Verificar se o sistema de notificações está disponível
    if (!window.showSuccess || !window.showError) {
        console.warn("Sistema de notificações não encontrado. Usando alertas padrão.");
        window.showSuccess = function(message) { alert(message); };
        window.showError = function(message) { alert(message); };
    }
    
    let students = [];
    let records = [];
    let filteredStudents = [];
    let selectedClass = '';
    let selectedFilter = 'all';
    let classes = [];
    
    // CORREÇÃO: Forçar recálculo da data atual a cada inicialização
    console.log("Inicializando página - Obtendo data atual");
    const todayString = getTodayString();
    console.log("Data atual (hoje) recalculada:", todayString);
    
    // Definir a data selecionada inicialmente como a data atual
    let currentSelectedDate = todayString;
    
    // Verificar se existe uma data salva no localStorage (vindo da página de calendário)
    const savedDate = localStorage.getItem('selectedDate');
    if (savedDate) {
        console.log("Data encontrada no localStorage:", savedDate);
        currentSelectedDate = savedDate;
        localStorage.removeItem('selectedDate'); // Limpar após usar
    }
    
    console.log("Data selecionada para exibição:", currentSelectedDate);
    
    // CORREÇÃO: Forçar atualização da exibição da data
    updateDateDisplay(currentSelectedDate);
    
    // Inicializar o seletor de data com a data selecionada
    dateSelector.value = currentSelectedDate;
    
    // Verificação adicional para garantir que a data está correta
    verifyDateDisplay();
    
    // Load initial data
    loadData(currentSelectedDate);
    
    // Event listeners
    refreshButton.addEventListener('click', () => {
        console.log("Botão Atualizar clicado - Recarregando dados para:", currentSelectedDate);
        loadData(currentSelectedDate);
    });
    
    // Today button event listener
    todayButton.addEventListener('click', () => {
        console.group("Botão Hoje Clicado");
        
        // Recalcular a data atual para garantir precisão
        const freshTodayString = getTodayString();
        console.log("Nova data atual:", freshTodayString);
        
        // Atualizar a data selecionada e a interface
        currentSelectedDate = freshTodayString;
        dateSelector.value = freshTodayString;
        console.log("Valor do seletor de data atualizado:", dateSelector.value);
        
        // Forçar a atualização do texto da data
        updateDateDisplay(currentSelectedDate);
        
        // Limpar qualquer data salva no localStorage para evitar problemas
        localStorage.removeItem('selectedDate');
        
        // Recarregar os dados para a data atual
        loadData(currentSelectedDate);
        
        // Verificação adicional
        verifyDateDisplay();
        
        console.groupEnd();
    });
    
    // Date selector event listener
    dateSelector.addEventListener('change', function() {
        console.group("Seleção de Nova Data");
        console.log("Valor do seletor de data:", this.value);
        
        currentSelectedDate = this.value;
        console.log("Nova data selecionada:", currentSelectedDate);
        
        // Forçar a atualização do texto da data
        updateDateDisplay(currentSelectedDate);
        
        loadData(currentSelectedDate);
        
        // Verificação adicional
        verifyDateDisplay();
        console.groupEnd();
    });
    
    // Função para atualizar a exibição da data na interface
    function updateDateDisplay(dateString) {
        console.group("Atualização da Data na Interface");
        console.log("Data a ser formatada:", dateString);
        
        // Formatar a data para exibição
        const formattedDate = formatDisplayDate(dateString);
        console.log("Data formatada para exibição:", formattedDate);
        
        // Atualizar o elemento HTML
        currentDateElement.textContent = formattedDate;
        console.log("Elemento HTML atualizado:", currentDateElement.textContent);
        console.groupEnd();
    }
    
    // Função para verificar se a data exibida está correta
    function verifyDateDisplay() {
        console.group("Verificação de Data na Interface");
        
        // Verificar a data atual
        const actualToday = new Date();
        const actualYear = actualToday.getFullYear();
        const actualMonth = actualToday.getMonth() + 1;
        const actualDay = actualToday.getDate();
        
        console.log("Data real do sistema:", {
            ano: actualYear,
            mes: actualMonth,
            dia: actualDay,
            dataCompleta: actualToday
        });
        
        // Verificar a data exibida
        console.log("Data selecionada no sistema:", currentSelectedDate);
        console.log("Texto exibido na interface:", currentDateElement.textContent);
        
        // Verificar se a data do botão "Hoje" está correta
        const todayButtonDate = getTodayString();
        console.log("Data do botão 'Hoje':", todayButtonDate);
        
        console.groupEnd();
    }
    
    // Filter buttons event listener
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedFilter = this.getAttribute('data-filter');
            filterStudents();
            renderRecords();
        });
    });
    
    // Load data function
    async function loadData(dateString) {
        try {
            // Show loading state
            recordsList.innerHTML = '<div class="loading-container"><p>Carregando...</p></div>';
            
            // Get students and records
            students = await StorageService.getStudents();
            
            // Initialize records for the selected date if they don't exist
            await StorageService.initializeRecordsForDate(dateString);
            records = await StorageService.getRecordsByDate(dateString);
            
            // Extract unique classes
            classes = [...new Set(students.map(s => s.class))];
            
            // Render class filter buttons
            renderClassButtons();
            
            // Apply filters and render
            filterStudents();
            renderRecords();
        } catch (error) {
            console.error('Error loading data:', error);
            showError('Não foi possível carregar os dados', 'Erro');
            recordsList.innerHTML = '<div class="error-container"><p>Erro ao carregar dados</p></div>';
        }
    }
    
    // Render class filter buttons
    function renderClassButtons() {
        const classFilterButtons = document.querySelector('.class-filter-buttons');
        
        // Keep the "All classes" button
        let buttonsHTML = '<button class="class-filter-button active" data-class="">Todas as turmas</button>';
        
        // Add a button for each class
        classes.forEach(className => {
            buttonsHTML += `<button class="class-filter-button" data-class="${className}">${className}</button>`;
        });
        
        classFilterButtons.innerHTML = buttonsHTML;
        
        // Add event listeners to class filter buttons
        document.querySelectorAll('.class-filter-button').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.class-filter-button').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                selectedClass = this.getAttribute('data-class');
                filterStudents();
                renderRecords();
            });
        });
    }
    
    // Filter students based on selected class and meal status
    function filterStudents() {
        let filtered = students;
        
        // Filter by class
        if (selectedClass) {
            filtered = filtered.filter(s => s.class === selectedClass);
        }
        
        // Filter by meal status or presence status
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(student => {
                const record = records.find(r => r.studentId === student.id);
                if (!record) return selectedFilter === 'none' || selectedFilter === 'absent';
                
                const hadLunch = record.hadLunch;
                const hadDinner = record.hadDinner;
                const isPresent = record.isPresent;
                
                switch (selectedFilter) {
                    case 'present':
                        return isPresent;
                    case 'absent':
                        return !isPresent;
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
        
        filteredStudents = filtered;
    }
    
    // Render records
    function renderRecords() {
        if (filteredStudents.length === 0) {
            recordsList.innerHTML = '';
            emptyContainer.classList.remove('hidden');
        } else {
            emptyContainer.classList.add('hidden');
            
            let recordsHTML = '';
            filteredStudents.forEach(student => {
                const record = records.find(r => r.studentId === student.id);
                if (!record) return;
                
                recordsHTML += `
                    <div class="record-card" data-id="${student.id}">
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
                        <div class="controls-container">
                            <div class="presence-container">
                                <button class="presence-button ${record.isPresent ? 'active' : ''}" data-action="presence" data-record-id="${record.id}">
                                    <i class="fas fa-check-circle"></i>
                                    Presente
                                </button>
                            </div>
                            <div class="meal-controls">
                                <button class="meal-button ${record.hadLunch ? 'active' : ''}" data-action="lunch" data-record-id="${record.id}">
                                    <i class="fas fa-utensils"></i>
                                    Almoço
                                </button>
                                <button class="meal-button ${record.hadDinner ? 'active' : ''}" data-action="dinner" data-record-id="${record.id}">
                                    <i class="fas fa-utensils"></i>
                                    Jantar
                                </button>
                            </div>
                            <div class="hours-container">
                                <i class="fas fa-clock"></i>
                                <span class="hours-label">Horas Extras:</span>
                                <div class="hours-controls">
                                    <button class="hours-button" data-action="decrease" data-record-id="${record.id}">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="hours-value">${record.extraHours}</span>
                                    <button class="hours-button" data-action="increase" data-record-id="${record.id}">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            recordsList.innerHTML = recordsHTML;
            
            // Add event listeners to presence button
            document.querySelectorAll('.presence-button').forEach(button => {
                button.addEventListener('click', async function() {
                    const recordId = this.getAttribute('data-record-id');
                    const record = records.find(r => r.id === recordId);
                    
                    if (record) {
                        record.isPresent = !record.isPresent;
                        record.updatedAt = new Date().toISOString();
                        
                        try {
                            await StorageService.updateRecord(record);
                            // Update UI
                            this.classList.toggle('active');
                            
                            // Mostrar notificação
                            if (record.isPresent) {
                                showSuccess(`${record.studentName} marcado como presente`, 'Presença');
                            } else {
                                showInfo(`${record.studentName} marcado como ausente`, 'Presença');
                            }
                        } catch (error) {
                            console.error('Error updating presence record:', error);
                            showError('Não foi possível atualizar a presença', 'Erro');
                        }
                    }
                });
            });
            
            // Add event listeners to meal buttons
            document.querySelectorAll('.meal-button').forEach(button => {
                button.addEventListener('click', async function() {
                    const recordId = this.getAttribute('data-record-id');
                    const action = this.getAttribute('data-action');
                    const record = records.find(r => r.id === recordId);
                    
                    if (record) {
                        if (action === 'lunch') {
                            record.hadLunch = !record.hadLunch;
                        } else if (action === 'dinner') {
                            record.hadDinner = !record.hadDinner;
                        }
                        
                        // Marcar como presente automaticamente se tiver almoço ou jantar
                        if ((record.hadLunch || record.hadDinner) && !record.isPresent) {
                            record.isPresent = true;
                            // Atualizar também o botão de presença na interface
                            const presenceButton = document.querySelector(`.presence-button[data-record-id="${recordId}"]`);
                            if (presenceButton) {
                                presenceButton.classList.add('active');
                            }
                        }
                        
                        record.updatedAt = new Date().toISOString();
                        
                        try {
                            await StorageService.updateRecord(record);
                            // Update UI
                            this.classList.toggle('active');
                        } catch (error) {
                            console.error('Error updating record:', error);
                            showError('Não foi possível atualizar o registro', 'Erro');
                        }
                    }
                });
            });
            
            // Add event listeners to hours buttons
            document.querySelectorAll('.hours-button').forEach(button => {
                button.addEventListener('click', async function() {
                    const recordId = this.getAttribute('data-record-id');
                    const action = this.getAttribute('data-action');
                    const record = records.find(r => r.id === recordId);
                    
                    if (record) {
                        const delta = action === 'increase' ? 1 : -1;
                        const newHours = Math.max(0, Math.min(5, record.extraHours + delta));
                        
                        if (newHours !== record.extraHours) {
                            record.extraHours = newHours;
                            
                            // Marcar como presente automaticamente se tiver horas extras
                            if (newHours > 0 && !record.isPresent) {
                                record.isPresent = true;
                                // Atualizar também o botão de presença na interface
                                const presenceButton = document.querySelector(`.presence-button[data-record-id="${recordId}"]`);
                                if (presenceButton) {
                                    presenceButton.classList.add('active');
                                }
                            }
                            
                            record.updatedAt = new Date().toISOString();
                            
                            try {
                                await StorageService.updateRecord(record);
                                // Update UI
                                const hoursValueElement = this.parentElement.querySelector('.hours-value');
                                hoursValueElement.textContent = newHours;
                            } catch (error) {
                                console.error('Error updating record:', error);
                                showError('Não foi possível atualizar o registro', 'Erro');
                            }
                        }
                    }
                });
            });
        }
    }
});