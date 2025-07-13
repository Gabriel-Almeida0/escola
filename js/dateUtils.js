// Format date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Format date as DD/MM/YYYY (Brazilian format)
function formatDisplayDate(dateString) {
    // CORREÇÃO FINAL: Usar uma abordagem mais direta para formatar a data
    console.log("Formatando data para exibição (entrada):", dateString);
    
    try {
        // Extrair os componentes da data da string (formato YYYY-MM-DD)
        const parts = dateString.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]); // Sem ajuste adicional
        
        // Validar os componentes
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new Error("Formato de data inválido");
        }
        
        // Formatar diretamente no formato brasileiro (DD/MM/YYYY)
        const formattedDate = `${day}/${month}/${year}`;
        console.log("Data formatada para exibição (final):", formattedDate);
        
        return formattedDate;
    } catch (error) {
        console.error("Erro ao formatar data:", error);
        
        // Fallback para o método anterior sem ajuste adicional
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
}

// Get today's date in YYYY-MM-DD format
function getTodayString() {
    // Abordagem simples e direta para obter a data atual
    // Criar data com a data atual
    const now = new Date();
    
    // Obter componentes da data no fuso horário local
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // Janeiro é 0, então adicionamos 1
    const day = now.getDate();
    
    // Formatar como YYYY-MM-DD garantindo zeros à esquerda
    const formattedDate = 
        year + '-' + 
        (month < 10 ? '0' : '') + month + '-' + 
        (day < 10 ? '0' : '') + day;
    
    console.log("Data atual (sem ajustes):", formattedDate);
    console.log("Data original:", now);
    
    return formattedDate;
}

// Get month name in Portuguese
function getMonthName(month) {
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month - 1];
}

// Função de diagnóstico para verificar problemas com datas
function diagnosticDateCheck() {
    console.group("Diagnóstico de Datas");
    
    // 1. Verificar a data atual usando diferentes métodos
    const now = new Date();
    console.log("Data/Hora completa:", now);
    console.log("toString():", now.toString());
    console.log("toISOString():", now.toISOString());
    console.log("toLocaleDateString():", now.toLocaleDateString());
    
    // 2. Componentes da data local
    console.log("Componentes locais:", {
        ano: now.getFullYear(),
        mês: now.getMonth() + 1,
        dia: now.getDate(),
        hora: now.getHours(),
        minutos: now.getMinutes()
    });
    
    // 3. Componentes da data UTC
    console.log("Componentes UTC:", {
        ano: now.getUTCFullYear(),
        mês: now.getUTCMonth() + 1,
        dia: now.getUTCDate(),
        hora: now.getUTCHours(),
        minutos: now.getUTCMinutes()
    });
    
    // 4. Verificar o fuso horário
    console.log("Timezone offset (minutos):", now.getTimezoneOffset());
    
    // 5. Testar a função getTodayString
    console.log("getTodayString():", getTodayString());
    
    // 6. Testar criação de data a partir de string
    const testDateStr = getTodayString();
    const testDate = new Date(testDateStr);
    console.log("Data criada a partir da string:", testDateStr, "->", testDate);
    
    // 7. Testar formatDisplayDate
    const displayDate = formatDisplayDate(testDateStr);
    console.log("formatDisplayDate resultado:", displayDate);
    
    console.groupEnd();
}

// Executar diagnóstico automaticamente
window.addEventListener('DOMContentLoaded', function() {
    console.log("Executando diagnóstico de datas...");
    diagnosticDateCheck();
});