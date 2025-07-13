// Configuração do banco de dados local
const CONFIG = {
    // Nome e versão do banco de dados local
    DB_NAME: 'app_local_db',
    DB_VERSION: 1,
    
    // Coleções (tabelas) utilizadas no projeto
    COLLECTIONS: {
        STUDENTS: 'students',
        CALENDAR: 'calendar',
        REPORTS: 'reports',
        DAILY_RECORDS: 'daily_records'
    }
};

// Expor no escopo global para uso no navegador
window.CONFIG = CONFIG;

console.log("Configuração local carregada"); 