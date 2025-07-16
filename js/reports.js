document.addEventListener('DOMContentLoaded', function() {
    const monthSelect = document.getElementById('monthSelect');
    const yearInput = document.getElementById('yearInput');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const exportSheetBtn = document.getElementById('exportSheetBtn');
    const reportTableBody = document.getElementById('reportTableBody');
    const totalPresenceCountElement = document.getElementById('totalPresenceCount');
    const totalLunchCountElement = document.getElementById('totalLunchCount');
    const totalDinnerCountElement = document.getElementById('totalDinnerCount');
    const totalMealsCountElement = document.getElementById('totalMealsCount');
    const totalExtraHoursCountElement = document.getElementById('totalExtraHoursCount');
    
    // Set default month to current month
    const currentDate = new Date();
    monthSelect.value = (currentDate.getMonth() + 1).toString();
    yearInput.value = currentDate.getFullYear().toString();
    
    // Initialize
    loadReport();
    
    // Event listeners
    generateReportBtn.addEventListener('click', loadReport);
    exportSheetBtn.addEventListener('click', exportReport);
    
    async function loadReport() {
        try {
            reportTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando...</td></tr>';
            
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
            const totalPresences = reportData.reduce((sum, item) => sum + item.totalPresences, 0);
            const totalLunches = reportData.reduce((sum, item) => sum + item.totalLunches, 0);
            const totalDinners = reportData.reduce((sum, item) => sum + item.totalDinners, 0);
            const totalMeals = totalLunches + totalDinners; // Total de refeições = almoços + jantares
            const totalExtraHours = reportData.reduce((sum, item) => sum + item.totalExtraHours, 0);
            
            totalPresenceCountElement.textContent = totalPresences;
            totalLunchCountElement.textContent = totalLunches;
            totalDinnerCountElement.textContent = totalDinners;
            totalMealsCountElement.textContent = totalMeals;
            totalExtraHoursCountElement.textContent = totalExtraHours;
            
            // Render table
            renderReportTable(reportData);
        } catch (error) {
            console.error('Error loading report:', error);
            showError('Não foi possível carregar o relatório');
            reportTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Erro ao carregar relatório</td></tr>';
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
                totalPresences: 0,
                totalLunches: 0,
                totalDinners: 0,
                totalMeals: 0, // Novo campo para total de refeições
                totalExtraHours: 0
            });
        });
        
        // Process records
        monthRecords.forEach(record => {
            const studentData = studentMap.get(record.studentId);
            if (studentData) {
                if (record.isPresent) studentData.totalPresences++;
                if (record.hadLunch) studentData.totalLunches++;
                if (record.hadDinner) studentData.totalDinners++;
                
                // Calcular total de refeições para este registro
                const mealsInThisRecord = (record.hadLunch ? 1 : 0) + (record.hadDinner ? 1 : 0);
                studentData.totalMeals += mealsInThisRecord;
                
                studentData.totalExtraHours += record.extraHours || 0;
            }
        });
        
        // Convert map to array and sort by student name
        return Array.from(studentMap.values())
            .sort((a, b) => a.studentName.localeCompare(b.studentName));
    }
    
    function renderReportTable(reportData) {
        if (reportData.length === 0) {
            reportTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum dado disponível para este mês</td></tr>';
            return;
        }
        
        let tableHTML = '';
        reportData.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.studentName}</td>
                    <td>${item.class}</td>
                    <td>${item.totalPresences}</td>
                    <td>${item.totalLunches}</td>
                    <td>${item.totalDinners}</td>
                    <td>${item.totalMeals}</td>
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
            
            // Get table data
            const rows = reportTableBody.querySelectorAll('tr');
            if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('td[colspan]'))) {
                showWarning('Não há dados para exportar');
                return;
            }
            
            // Adicionar BOM para garantir que o Excel/Google Planilhas reconheça o UTF-8
            const BOM = '\uFEFF';
            
            // Create CSV content optimized for Google Sheets
            let csvContent = BOM; // Iniciar com BOM para UTF-8
            
            // Cabeçalho com informações do relatório
            csvContent += 'Relatório de Atividades\n';
            csvContent += `Período:,${monthName} ${year}\n\n`;
            
            // Cabeçalho das colunas com formatação especial para Google Sheets
            csvContent += 'Aluno,Turma,Total de Presenças,Total de Almoços,Total de Jantares,Total de Refeições,Total de Horas Extras\n';
            
            // Dados das linhas
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                // Garantir que textos com vírgulas sejam devidamente escapados com aspas
                const rowData = Array.from(cells).map(cell => {
                    const text = cell.textContent.trim();
                    // Escapar aspas duplicando-as e envolver em aspas se contiver vírgulas ou aspas
                    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                        return `"${text.replace(/"/g, '""')}"`;
                    }
                    return text;
                });
                csvContent += rowData.join(',') + '\n';
            });
            
            // Adicionar linha em branco e resumo
            csvContent += '\n';
            csvContent += `Resumo,\n`;
            csvContent += `Total de Presenças:,${totalPresenceCountElement.textContent}\n`;
            csvContent += `Total de Almoços:,${totalLunchCountElement.textContent}\n`;
            csvContent += `Total de Jantares:,${totalDinnerCountElement.textContent}\n`;
            csvContent += `Total de Refeições:,${totalMealsCountElement.textContent}\n`;
            csvContent += `Total de Horas Extras:,${totalExtraHoursCountElement.textContent}\n`;
            
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
            
            // Show notification with instructions for Google Sheets
            showNotification(
                'Exportação concluída', 
                `Relatório exportado com sucesso!<br><br>
                <strong>Para abrir no Google Planilhas:</strong><br>
                1. Acesse drive.google.com<br>
                2. Clique em "Novo" > "Upload de arquivo"<br>
                3. Selecione o arquivo CSV baixado<br>
                4. Abra o arquivo com Google Planilhas`,
                'success',
                8000
            );
        } catch (error) {
            console.error('Error exporting report:', error);
            showError('Não foi possível exportar o relatório para planilha');
        }
    }
});