document.addEventListener('DOMContentLoaded', function() {
    const calendarTitle = document.getElementById('calendarTitle');
    const calendarBody = document.getElementById('calendarBody');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const selectedDateElement = document.getElementById('selectedDate');
    const lunchCountElement = document.getElementById('lunchCount');
    const dinnerCountElement = document.getElementById('dinnerCount');
    const extraHoursCountElement = document.getElementById('extraHoursCount');
    const editDayButton = document.getElementById('editDayButton');
    
    // Current state
    let currentDate = new Date();
    let selectedDate = new Date();
    let allRecords = [];
    let selectedDateString = '';
    
    // Initialize
    loadAllRecords();
    
    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Edit day button event listener
    editDayButton.addEventListener('click', () => {
        if (selectedDateString) {
            // Store the selected date in localStorage
            localStorage.setItem('selectedDate', selectedDateString);
            // Redirect to the main page
            window.location.href = 'index.html';
        } else {
            alert('Por favor, selecione uma data no calendário primeiro.');
        }
    });
    
    async function loadAllRecords() {
        try {
            allRecords = await StorageService.getRecords();
            renderCalendar();
            
            // Check if there is a selected date from previous page
            const today = formatDate(new Date());
            selectedDateString = today;
            updateDailySummary(today);
        } catch (error) {
            console.error('Error loading records:', error);
            alert('Não foi possível carregar os registros');
        }
    }
    
    function renderCalendar() {
        // Update calendar title
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        calendarTitle.textContent = `${getMonthName(month)} ${year}`;
        
        // Get first day of month and total days
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Clear calendar
        calendarBody.innerHTML = '';
        
        // Create calendar rows and cells
        let date = 1;
        for (let i = 0; i < 6; i++) { // Max 6 weeks in a month
            // Create table row
            const row = document.createElement('tr');
            
            // Create cells for the row
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                if (i === 0 && j < startingDay) {
                    // Empty cells before the 1st day
                    cell.innerHTML = '';
                } else if (date > daysInMonth) {
                    // Empty cells after the last day
                    break;
                } else {
                    // Valid day cells
                    const dayDate = new Date(year, month - 1, date);
                    const dateString = formatDate(dayDate);
                    const isToday = isSameDay(dayDate, new Date());
                    const isSelected = isSameDay(dayDate, selectedDate);
                    
                    // Get records for this day
                    const dayRecords = allRecords.filter(record => record.date === dateString);
                    const lunchCount = dayRecords.filter(record => record.hadLunch).length;
                    const dinnerCount = dayRecords.filter(record => record.hadDinner).length;
                    
                    // Create day element
                    const dayElement = document.createElement('div');
                    dayElement.className = `calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;
                    dayElement.innerHTML = `
                        <span>${date}</span>
                        ${(lunchCount > 0 || dinnerCount > 0) ? `
                            <div class="calendar-day-status">
                                ${lunchCount > 0 ? '<div class="status-dot lunch"></div>' : ''}
                                ${dinnerCount > 0 ? '<div class="status-dot dinner"></div>' : ''}
                            </div>
                        ` : ''}
                    `;
                    
                    // Add click event to select day
                    cell.addEventListener('click', () => {
                        // Remove selected class from previous selection
                        const previousSelected = document.querySelector('.calendar-day.selected');
                        if (previousSelected) {
                            previousSelected.classList.remove('selected');
                        }
                        
                        // Add selected class to current selection
                        dayElement.classList.add('selected');
                        
                        // Update selected date and summary
                        selectedDate = dayDate;
                        selectedDateString = dateString;
                        updateDailySummary(dateString);
                    });
                    
                    cell.appendChild(dayElement);
                    date++;
                }
                
                row.appendChild(cell);
            }
            
            calendarBody.appendChild(row);
            
            // Stop if we've reached the end of the month
            if (date > daysInMonth) break;
        }
    }
    
    function updateDailySummary(dateString) {
        // Update the date display
        selectedDateElement.textContent = formatDisplayDate(dateString);
        
        // Get records for the selected date
        const dayRecords = allRecords.filter(record => record.date === dateString);
        
        // Calculate statistics
        const lunchCount = dayRecords.filter(record => record.hadLunch).length;
        const dinnerCount = dayRecords.filter(record => record.hadDinner).length;
        const extraHours = dayRecords.reduce((total, record) => total + (record.extraHours || 0), 0);
        
        // Update UI
        lunchCountElement.textContent = lunchCount;
        dinnerCountElement.textContent = dinnerCount;
        extraHoursCountElement.textContent = extraHours;
    }
    
    // Helper function to check if two dates are the same day
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
});