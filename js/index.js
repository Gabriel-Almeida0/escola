document.addEventListener('DOMContentLoaded', function() {
    const recordsList = document.getElementById('recordsList');
    const currentDateElement = document.getElementById('currentDate');
    const refreshButton = document.getElementById('refreshButton');
    const emptyContainer = document.querySelector('.empty-container');
    
    let students = [];
    let records = [];
    let filteredStudents = [];
    let selectedClass = '';
    let selectedFilter = 'all';
    let classes = [];
    
    const todayString = getTodayString();
    currentDateElement.textContent = formatDisplayDate(todayString);
    
    // Load initial data
    loadData();
    
    // Event listeners
    refreshButton.addEventListener('click', loadData);
    
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
    async function loadData() {
        try {
            // Show loading state
            recordsList.innerHTML = '<div class="loading-container"><p>Carregando...</p></div>';
            
            // Get students and records
            students = await StorageService.getStudents();
            records = await StorageService.getRecordsByDate(todayString);
            
            // Initialize records for today if they don't exist
            await StorageService.initializeRecordsForDate(todayString);
            records = await StorageService.getRecordsByDate(todayString);
            
            // Extract unique classes
            classes = [...new Set(students.map(s => s.class))];
            
            // Render class filter buttons
            renderClassButtons();
            
            // Apply filters and render
            filterStudents();
            renderRecords();
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Não foi possível carregar os dados');
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
                        
                        record.updatedAt = new Date().toISOString();
                        
                        try {
                            await StorageService.updateRecord(record);
                            // Update UI
                            this.classList.toggle('active');
                        } catch (error) {
                            console.error('Error updating record:', error);
                            alert('Não foi possível atualizar o registro');
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
                            record.updatedAt = new Date().toISOString();
                            
                            try {
                                await StorageService.updateRecord(record);
                                // Update UI
                                const hoursValueElement = this.parentElement.querySelector('.hours-value');
                                hoursValueElement.textContent = newHours;
                            } catch (error) {
                                console.error('Error updating record:', error);
                                alert('Não foi possível atualizar o registro');
                            }
                        }
                    }
                });
            });
        }
    }
});