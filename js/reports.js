document.addEventListener('DOMContentLoaded', function() {
    const monthSelect = document.getElementById('monthSelect');
    const yearInput = document.getElementById('yearInput');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const reportTableBody = document.getElementById('reportTableBody');
    const totalLunchCountElement = document.getElementById('totalLunchCount');
    const totalDinnerCountElement = document.getElementById('totalDinnerCount');
    const totalExtraHoursCountElement = document.getElementById('totalExtraHoursCount');
    
    // Set default month to current month
    const currentDate = new Date();
    monthSelect.value = (currentDate.getMonth() + 1).toString();
    yearInput.value = currentDate.getFullYear().toString();
    
    // Load saved paper preference
    loadPaperPreference();
    
    // Initialize
    loadReport();
    
    // Event listeners
    generateReportBtn.addEventListener('click', loadReport);
    exportReportBtn.addEventListener('click', exportReport);
    
    // Add event listeners to paper options
    document.querySelectorAll('input[name="paperType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            savePaperPreference(this.value);
        });
    });
    
    // Save paper preference to localStorage
    function savePaperPreference(value) {
        try {
            localStorage.setItem('preferred_paper_type', value);
            console.log('Paper preference saved:', value);
        } catch (error) {
            console.error('Error saving paper preference:', error);
        }
    }
    
    // Load paper preference from localStorage
    function loadPaperPreference() {
        try {
            const savedPreference = localStorage.getItem('preferred_paper_type');
            if (savedPreference) {
                const radioOption = document.querySelector(`input[name="paperType"][value="${savedPreference}"]`);
                if (radioOption) {
                    radioOption.checked = true;
                    console.log('Paper preference loaded:', savedPreference);
                }
            }
        } catch (error) {
            console.error('Error loading paper preference:', error);
        }
    }
    
    async function loadReport() {
        try {
            reportTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>';
            
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearInput.value);
            
            // Get all students
            const students = await StorageService.getStudents();
            
            // Get all records
            const allRecords = await StorageService.getRecords();
            
            // Filter records for the selected month
            const monthRecords = allRecords.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year;
            });
            
            // Generate report data
            const reportData = generateMonthlyReport(students, monthRecords);
            
            // Update summary
            const totalLunches = reportData.reduce((sum, item) => sum + item.totalLunches, 0);
            const totalDinners = reportData.reduce((sum, item) => sum + item.totalDinners, 0);
            const totalExtraHours = reportData.reduce((sum, item) => sum + item.totalExtraHours, 0);
            
            totalLunchCountElement.textContent = totalLunches;
            totalDinnerCountElement.textContent = totalDinners;
            totalExtraHoursCountElement.textContent = totalExtraHours;
            
            // Render table
            renderReportTable(reportData);
        } catch (error) {
            console.error('Error loading report:', error);
            alert('Não foi possível carregar o relatório');
            reportTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Erro ao carregar relatório</td></tr>';
        }
    }
    
    function generateMonthlyReport(students, monthRecords) {
        // Create a map to store data for each student
        const studentMap = new Map();
        
        // Initialize data for each student
        students.forEach(student => {
            studentMap.set(student.id, {
                studentId: student.id,
                studentName: student.name,
                class: student.class,
                totalLunches: 0,
                totalDinners: 0,
                totalExtraHours: 0
            });
        });
        
        // Process records
        monthRecords.forEach(record => {
            const studentData = studentMap.get(record.studentId);
            if (studentData) {
                if (record.hadLunch) studentData.totalLunches++;
                if (record.hadDinner) studentData.totalDinners++;
                studentData.totalExtraHours += record.extraHours || 0;
            }
        });
        
        // Convert map to array and sort by student name
        return Array.from(studentMap.values())
            .sort((a, b) => a.studentName.localeCompare(b.studentName));
    }
    
    function renderReportTable(reportData) {
        if (reportData.length === 0) {
            reportTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum dado disponível para este mês</td></tr>';
            return;
        }
        
        let tableHTML = '';
        reportData.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.studentName}</td>
                    <td>${item.class}</td>
                    <td>${item.totalLunches}</td>
                    <td>${item.totalDinners}</td>
                    <td>${item.totalExtraHours}</td>
                </tr>
            `;
        });
        
        reportTableBody.innerHTML = tableHTML;
    }
    
    function exportReport() {
        try {
            const month = parseInt(monthSelect.value);
            const year = parseInt(yearInput.value);
            const monthName = getMonthName(month);
            
            // Get selected paper type
            const selectedPaperType = document.querySelector('input[name="paperType"]:checked');
            const paperTypeValue = selectedPaperType ? selectedPaperType.value : 'couche-brilho';
            const paperTypeLabel = selectedPaperType ? selectedPaperType.nextElementSibling.textContent.trim() : 'Couché Brilho 250g';
            
            // Get table data
            const rows = reportTableBody.querySelectorAll('tr');
            if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('td[colspan]'))) {
                alert('Não há dados para exportar');
                return;
            }
            
            // Create CSV content
            let csvContent = 'Relatório de Atividades\n';
            csvContent += `Período: ${monthName} ${year}\n`;
            csvContent += `Papel da Capa: ${paperTypeLabel}\n\n`;
            csvContent += 'Aluno,Turma,Total de Almoços,Total de Jantares,Total de Horas Extras\n';
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`);
                csvContent += rowData.join(',') + '\n';
            });
            
            // Create blob and download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `relatorio_${monthName.toLowerCase()}_${year}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show confirmation with paper type
            alert(`Relatório exportado com sucesso!\nTipo de papel para capa: ${paperTypeLabel}`);
        } catch (error) {
            console.error('Error exporting report:', error);
            alert('Não foi possível exportar o relatório');
        }
    }
});