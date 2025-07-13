// Inicialização do banco de dados local
// Carregando configuração básica
// Variáveis globais declaradas apenas uma vez
let initializationComplete = false;
let initializationPromise = null;

if (typeof CONFIG === 'undefined') {
    try {
        // Tenta carregar o arquivo de configuração
        const scriptElement = document.createElement('script');
        scriptElement.src = 'js/config.js';
        scriptElement.async = false;
        document.head.appendChild(scriptElement);
        
        // Esperar o script carregar
        scriptElement.onload = () => {
            console.log("Arquivo de configuração carregado com sucesso");
            initializeLocalDB();
        };
        
        scriptElement.onerror = () => {
            console.error("Erro ao carregar arquivo de configuração");
            // Criar configuração padrão
            window.CONFIG = {
                DB_NAME: 'app_local_db',
                DB_VERSION: 1,
                COLLECTIONS: {
                    STUDENTS: 'students',
                    CALENDAR: 'calendar',
                    REPORTS: 'reports',
                    DAILY_RECORDS: 'daily_records'
                }
            };
            initializeLocalDB();
        };
    } catch (e) {
        console.error("Erro ao carregar configuração:", e);
        // Criar configuração padrão
        window.CONFIG = {
            DB_NAME: 'app_local_db',
            DB_VERSION: 1,
            COLLECTIONS: {
                STUDENTS: 'students',
                CALENDAR: 'calendar',
                REPORTS: 'reports',
                DAILY_RECORDS: 'daily_records'
            }
        };
        initializeLocalDB();
    }
} else {
    // CONFIG já existe, inicializa diretamente
    initializeLocalDB();
}

// Função principal que será chamada após carregar a configuração
function initializeLocalDB() {
    console.log("Inicializando banco de dados local...");
    
    // IMPLEMENTAÇÃO DE BANCO DE DADOS LOCAL USANDO INDEXEDDB
    class LocalStorage {
        constructor() {
            this.db = null;
            this.dbName = CONFIG.DB_NAME;
            this.version = CONFIG.DB_VERSION;
            this.collections = [
                CONFIG.COLLECTIONS.STUDENTS, 
                CONFIG.COLLECTIONS.CALENDAR, 
                CONFIG.COLLECTIONS.REPORTS,
                'daily_records'  // Para compatibilidade
            ];
        }
        
        async init() {
            return new Promise((resolve, reject) => {
                // Primeiro, abrir sem especificar versão para obter a versão atual
                const checkRequest = indexedDB.open(this.dbName);
                
                checkRequest.onsuccess = (event) => {
                    const currentVersion = event.target.result.version;
                    event.target.result.close();
                    
                    // Usar a maior versão entre a atual e a configurada
                    const versionToUse = Math.max(currentVersion, this.version);
                    console.log(`Abrindo banco de dados com versão ${versionToUse} (configurada: ${this.version}, existente: ${currentVersion})`);
                    
                    // Agora abrir com a versão correta
                    const request = indexedDB.open(this.dbName, versionToUse);
                    
                    request.onerror = event => {
                        console.error("Erro ao abrir banco de dados local:", event);
                        reject("Erro ao abrir banco de dados local");
                    };
                    
                    request.onsuccess = event => {
                        this.db = event.target.result;
                        console.log("Banco de dados local inicializado com sucesso");
                        
                        // Verificar se todas as coleções necessárias existem
                        const missingStores = [];
                        this.collections.forEach(collection => {
                            if (!this.db.objectStoreNames.contains(collection)) {
                                missingStores.push(collection);
                            }
                        });
                        
                        // Se alguma coleção estiver faltando, aumentar a versão e reabrir
                        if (missingStores.length > 0) {
                            console.warn(`Coleções faltando: ${missingStores.join(', ')}. Atualizando banco de dados...`);
                            this.db.close();
                            const newVersion = versionToUse + 1;
                            const upgradeRequest = indexedDB.open(this.dbName, newVersion);
                            
                            upgradeRequest.onupgradeneeded = event => {
                                const db = event.target.result;
                                missingStores.forEach(collection => {
                                    if (!db.objectStoreNames.contains(collection)) {
                                        db.createObjectStore(collection, { keyPath: 'id' });
                                        console.log(`Store '${collection}' criada durante atualização`);
                                    }
                                });
                            };
                            
                            upgradeRequest.onsuccess = event => {
                                this.db = event.target.result;
                                console.log("Banco de dados atualizado com sucesso");
                                resolve(true);
                            };
                            
                            upgradeRequest.onerror = event => {
                                console.error("Erro ao atualizar banco de dados:", event);
                                reject("Erro ao atualizar banco de dados");
                            };
                        } else {
                            resolve(true);
                        }
                    };
                    
                    request.onupgradeneeded = event => {
                        const db = event.target.result;
                        
                        // Criar stores para cada coleção que usaremos
                        this.collections.forEach(collection => {
                            if (!db.objectStoreNames.contains(collection)) {
                                db.createObjectStore(collection, { keyPath: 'id' });
                                console.log(`Store '${collection}' criada`);
                            }
                        });
                    };
                };
                
                checkRequest.onerror = (event) => {
                    console.error("Erro ao verificar versão do banco de dados:", event);
                    reject("Erro ao verificar versão do banco de dados");
                };
            });
        }
        
        async getAll(collection) {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject("Banco de dados local não inicializado");
                    return;
                }
                
                try {
                    const transaction = this.db.transaction([collection], "readonly");
                    const store = transaction.objectStore(collection);
                    const request = store.getAll();
                    
                    request.onsuccess = () => {
                        resolve(request.result);
                    };
                    
                    request.onerror = event => {
                        console.error(`Erro ao buscar dados de ${collection}:`, event);
                        reject("Erro ao buscar dados locais");
                    };
                } catch (error) {
                    console.error(`Erro na transação com ${collection}:`, error);
                    reject(error);
                }
            });
        }
        
        async get(collection, id) {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject("Banco de dados local não inicializado");
                    return;
                }
                
                try {
                    const transaction = this.db.transaction([collection], "readonly");
                    const store = transaction.objectStore(collection);
                    const request = store.get(id);
                    
                    request.onsuccess = () => {
                        resolve(request.result);
                    };
                    
                    request.onerror = event => {
                        console.error(`Erro ao buscar dado ${id} de ${collection}:`, event);
                        reject("Erro ao buscar dado local");
                    };
                } catch (error) {
                    console.error(`Erro na transação com ${collection}:`, error);
                    reject(error);
                }
            });
        }
        
        async add(collection, data) {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject("Banco de dados local não inicializado");
                    return;
                }
                
                try {
                    // Garantir que temos um ID e timestamps
                    if (!data.id) {
                        data.id = generateLocalId();
                    }
                    
                    data.createdAt = data.createdAt || new Date().toISOString();
                    data.updatedAt = new Date().toISOString();
                    
                    const transaction = this.db.transaction([collection], "readwrite");
                    const store = transaction.objectStore(collection);
                    
                    // Verificar se já existe um item com este ID
                    const getRequest = store.get(data.id);
                    
                    getRequest.onsuccess = () => {
                        if (getRequest.result) {
                            // Se existe, atualizar em vez de adicionar
                            data = { ...getRequest.result, ...data, updatedAt: new Date().toISOString() };
                        }
                        
                        // Adicionar ou atualizar
                        const request = store.put(data);
                        
                        request.onsuccess = () => {
                            console.log(`Dado adicionado/atualizado localmente em ${collection}`);
                            resolve(data.id);
                        };
                        
                        request.onerror = event => {
                            console.error(`Erro ao adicionar em ${collection}:`, event);
                            reject("Erro ao salvar dados localmente");
                        };
                    };
                    
                    getRequest.onerror = event => {
                        console.error(`Erro ao verificar existência em ${collection}:`, event);
                        reject("Erro ao verificar dados localmente");
                    };
                } catch (error) {
                    console.error(`Erro na transação com ${collection}:`, error);
                    reject(error);
                }
            });
        }
        
        async update(collection, id, data) {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject("Banco de dados local não inicializado");
                    return;
                }
                
                try {
                    // Primeiro, buscar o registro existente
                    const transaction = this.db.transaction([collection], "readwrite");
                    const store = transaction.objectStore(collection);
                    const getRequest = store.get(id);
                    
                    getRequest.onsuccess = () => {
                        const existingData = getRequest.result;
                        
                        if (!existingData) {
                            // Se o registro não existe, tenta adicionar como novo
                            data.id = id;
                            const addRequest = store.add({
                                ...data,
                                id,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            });
                            
                            addRequest.onsuccess = () => {
                                console.log(`Registro não encontrado, adicionado como novo em ${collection}`);
                                resolve(id);
                            };
                            
                            addRequest.onerror = event => {
                                console.error(`Erro ao adicionar novo registro em ${collection}:`, event);
                                reject("Erro ao adicionar novo registro local");
                            };
                            return;
                        }
                        
                        // Mesclar os dados e atualizar timestamp
                        const updatedData = { 
                            ...existingData, 
                            ...data, 
                            updatedAt: new Date().toISOString()
                        };
                        
                        const request = store.put(updatedData);
                        
                        request.onsuccess = () => {
                            console.log(`Dado atualizado localmente em ${collection}`);
                            resolve(id);
                        };
                        
                        request.onerror = event => {
                            console.error(`Erro ao atualizar ${id} em ${collection}:`, event);
                            reject("Erro ao atualizar dados localmente");
                        };
                    };
                    
                    getRequest.onerror = event => {
                        console.error(`Erro ao buscar registro para atualização em ${collection}:`, event);
                        reject("Erro ao buscar registro local para atualização");
                    };
                } catch (error) {
                    console.error(`Erro na transação com ${collection}:`, error);
                    reject(error);
                }
            });
        }
        
        async delete(collection, id) {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject("Banco de dados local não inicializado");
                    return;
                }
                
                try {
                    const transaction = this.db.transaction([collection], "readwrite");
                    const store = transaction.objectStore(collection);
                    
                    // Primeiro verificar se existe
                    const getRequest = store.get(id);
                    
                    getRequest.onsuccess = () => {
                        if (!getRequest.result) {
                            // Se não existe, consideramos como sucesso
                            console.log(`Registro ${id} já não existe em ${collection}`);
                            resolve(true);
                            return;
                        }
                        
                        const request = store.delete(id);
                        
                        request.onsuccess = () => {
                            console.log(`Dado removido localmente de ${collection}`);
                            resolve(true);
                        };
                        
                        request.onerror = event => {
                            console.error(`Erro ao remover ${id} de ${collection}:`, event);
                            reject("Erro ao remover dados localmente");
                        };
                    };
                    
                    getRequest.onerror = event => {
                        console.error(`Erro ao verificar existência para remoção em ${collection}:`, event);
                        reject("Erro ao verificar existência local para remoção");
                    };
                } catch (error) {
                    console.error(`Erro na transação com ${collection}:`, error);
                    reject(error);
                }
            });
        }
        
        // NOVA FUNÇÃO: Exportar todos os dados para JSON
        async exportAllData() {
            if (!this.db) {
                throw new Error("Banco de dados local não inicializado");
            }
            
            try {
                const exportData = {};
                
                // Exportar cada coleção
                for (const collection of this.collections) {
                    exportData[collection] = await this.getAll(collection);
                }
                
                // Adicionar metadados
                exportData._metadata = {
                    exportDate: new Date().toISOString(),
                    dbName: this.dbName,
                    dbVersion: this.version,
                    collections: this.collections
                };
                
                return exportData;
            } catch (error) {
                console.error("Erro ao exportar dados:", error);
                throw error;
            }
        }
        
        // NOVA FUNÇÃO: Importar dados de JSON
        async importData(jsonData) {
            if (!this.db) {
                throw new Error("Banco de dados local não inicializado");
            }
            
            if (!jsonData || typeof jsonData !== 'object') {
                throw new Error("Dados inválidos para importação");
            }
            
            try {
                const results = {
                    success: true,
                    totalImported: 0,
                    collectionResults: {}
                };
                
                // Importar cada coleção
                for (const collection of this.collections) {
                    if (Array.isArray(jsonData[collection])) {
                        const collectionData = jsonData[collection];
                        results.collectionResults[collection] = {
                            total: collectionData.length,
                            imported: 0,
                            errors: 0
                        };
                        
                        // Importar cada item da coleção
                        for (const item of collectionData) {
                            try {
                                if (item && item.id) {
                                    await this.add(collection, item);
                                    results.collectionResults[collection].imported++;
                                    results.totalImported++;
                                } else {
                                    console.warn(`Item sem ID em ${collection}, ignorado:`, item);
                                    results.collectionResults[collection].errors++;
                                }
                            } catch (itemError) {
                                console.error(`Erro ao importar item em ${collection}:`, itemError);
                                results.collectionResults[collection].errors++;
                            }
                        }
                    } else {
                        console.warn(`Coleção ${collection} não encontrada nos dados de importação ou não é um array`);
                        results.collectionResults[collection] = {
                            total: 0,
                            imported: 0,
                            errors: 0
                        };
                    }
                }
                
                return results;
            } catch (error) {
                console.error("Erro ao importar dados:", error);
                throw error;
            }
        }
        
        // NOVA FUNÇÃO: Limpar todos os dados
        async clearAllData() {
            if (!this.db) {
                throw new Error("Banco de dados local não inicializado");
            }
            
            try {
                const results = {
                    success: true,
                    collectionsCleared: 0
                };
                
                // Limpar cada coleção
                for (const collection of this.collections) {
                    try {
                        const transaction = this.db.transaction([collection], "readwrite");
                        const store = transaction.objectStore(collection);
                        
                        await new Promise((resolve, reject) => {
                            const request = store.clear();
                            
                            request.onsuccess = () => {
                                console.log(`Coleção ${collection} limpa com sucesso`);
                                results.collectionsCleared++;
                                resolve();
                            };
                            
                            request.onerror = (event) => {
                                console.error(`Erro ao limpar coleção ${collection}:`, event);
                                reject(event);
                            };
                        });
                    } catch (collectionError) {
                        console.error(`Erro ao limpar coleção ${collection}:`, collectionError);
                    }
                }
                
                return results;
            } catch (error) {
                console.error("Erro ao limpar dados:", error);
                throw error;
            }
        }
    }

    // Gerar ID local único
    function generateLocalId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Inicializar armazenamento local
    const localDB = new LocalStorage();

    // Função para inicializar o banco de dados
    async function initializeDatabase() {
        // Se já existe uma promessa de inicialização em andamento, retorna ela
        if (initializationPromise) {
            return initializationPromise;
        }
        
        // Cria uma nova promessa de inicialização
        initializationPromise = new Promise(async (resolve, reject) => {
            try {
                console.log("Iniciando inicialização do banco de dados local...");
                
                // Inicializar armazenamento local
                await localDB.init();
                console.log("Banco de dados local inicializado com sucesso");
                
                // Marcar como inicializado
                initializationComplete = true;
                
                // Disparar evento de conexão
                document.dispatchEvent(new CustomEvent('db-connected'));
                resolve(true);
            } catch (error) {
                console.error("Erro crítico ao inicializar o banco de dados local:", error);
                document.dispatchEvent(new CustomEvent('db-disconnected', { 
                    detail: { message: 'Falha na inicialização do banco de dados: ' + error.message } 
                }));
                initializationComplete = false;
                initializationPromise = null; // Limpar a promessa para permitir novas tentativas
                reject(error);
            }
        });
        
        return initializationPromise;
    }

    // Função para verificar conexão (sempre retorna verdadeiro pois é local)
    async function checkConnection() {
        try {
            if (!initializationComplete) {
                await initializeDatabase();
                document.dispatchEvent(new CustomEvent('db-connected'));
                return true;
            }
            
            // Verificar se o banco de dados está realmente disponível
            if (!localDB || !localDB.db) {
                // Tentar reinicializar
                initializationComplete = false;
                initializationPromise = null;
                await initializeDatabase();
            }
            
            document.dispatchEvent(new CustomEvent('db-connected'));
            return true;
        } catch (error) {
            console.error("Erro ao verificar conexão:", error);
            document.dispatchEvent(new CustomEvent('db-disconnected', { 
                detail: { message: 'Erro de inicialização do banco de dados: ' + error.message } 
            }));
            return false;
        }
    }

    // API PÚBLICA PARA USO NOS OUTROS ARQUIVOS
    // Funções de compatibilidade para não quebrar código existente

    // Função para salvar dados
    async function saveData(collectionName, data) {
        if (!initializationComplete) {
            await initializeDatabase();
        }
        return await localDB.add(collectionName, data);
    }

    // Função para atualizar dados existentes
    async function updateData(collectionName, docId, data) {
        if (!initializationComplete) {
            await initializeDatabase();
        }
        return await localDB.update(collectionName, docId, data);
    }

    // Função para buscar dados
    async function fetchData(collectionName, filters = {}, lim = 100) {
        try {
            if (!initializationComplete) {
                await initializeDatabase();
            }

            // Garantir que o banco de dados está disponível
            if (!localDB || !localDB.db) {
                console.error("Banco de dados não inicializado");
                return [];
            }

            // Verificar se a coleção existe
            if (!localDB.db.objectStoreNames.contains(collectionName)) {
                console.warn(`A coleção "${collectionName}" não existe no banco de dados`);
                return [];
            }

            // Buscar todos os dados
            const data = await localDB.getAll(collectionName);
            
            // Aplicar filtros localmente se houver
            let filteredData = [...data];
            
            if (filters.where) {
                const [field, operator, value] = filters.where;
                
                filteredData = filteredData.filter(item => {
                    switch (operator) {
                        case '==': return item[field] == value;
                        case '!=': return item[field] != value;
                        case '>': return item[field] > value;
                        case '>=': return item[field] >= value;
                        case '<': return item[field] < value;
                        case '<=': return item[field] <= value;
                        default: return true;
                    }
                });
            }
            
            // Aplicar ordenação
            if (filters.orderBy) {
                const [field, direction] = filters.orderBy;
                filteredData.sort((a, b) => {
                    if (direction === 'desc') {
                        return a[field] < b[field] ? 1 : -1;
                    }
                    return a[field] > b[field] ? 1 : -1;
                });
            }
            
            // Aplicar limite
            if (lim && filteredData.length > lim) {
                filteredData = filteredData.slice(0, lim);
            }
            
            return filteredData;
        } catch (error) {
            console.error(`Erro ao buscar dados da coleção "${collectionName}":`, error);
            return []; // Retornar array vazio em caso de erro para evitar quebras
        }
    }

    // Função para excluir dados
    async function deleteData(collectionName, docId) {
        try {
            if (!initializationComplete) {
                await initializeDatabase();
            }
            
            console.log(`Tentando excluir documento ${docId} da coleção ${collectionName}`);
            
            // Verificar se o ID é válido
            if (!docId) {
                console.error("ID inválido para exclusão:", docId);
                throw new Error("ID inválido para exclusão");
            }
            
            // Executar a exclusão
            const result = await localDB.delete(collectionName, docId);
            console.log(`Documento ${docId} excluído com sucesso da coleção ${collectionName}`);
            return result;
        } catch (error) {
            console.error(`Erro ao excluir documento ${docId} da coleção ${collectionName}:`, error);
            throw error;
        }
    }

    // NOVAS FUNÇÕES DE EXPORTAÇÃO E IMPORTAÇÃO
    
    // Exportar todos os dados para JSON
    async function exportDatabaseToJSON() {
        if (!initializationComplete) {
            await initializeDatabase();
        }
        
        try {
            const data = await localDB.exportAllData();
            const jsonString = JSON.stringify(data, null, 2);
            
            // Criar blob e link para download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Criar elemento de link e simular clique
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${CONFIG.DB_NAME}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Limpar
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            return {
                success: true,
                message: "Dados exportados com sucesso",
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error("Erro ao exportar banco de dados:", error);
            return {
                success: false,
                message: `Erro ao exportar: ${error.message}`,
                error: error
            };
        }
    }
    
    // Importar dados de um arquivo JSON
    async function importDatabaseFromJSON(file) {
        if (!initializationComplete) {
            await initializeDatabase();
        }
        
        return new Promise((resolve, reject) => {
            if (!file || !(file instanceof File)) {
                reject(new Error("Arquivo inválido"));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);
                    
                    // Validar estrutura básica
                    if (!jsonData || typeof jsonData !== 'object') {
                        reject(new Error("Formato de arquivo inválido"));
                        return;
                    }
                    
                    // Verificar se há metadados
                    if (!jsonData._metadata) {
                        console.warn("Arquivo de importação não contém metadados");
                    } else {
                        console.log("Importando dados do backup criado em:", jsonData._metadata.exportDate);
                    }
                    
                    // Importar dados
                    const result = await localDB.importData(jsonData);
                    resolve({
                        success: true,
                        message: `Importação concluída: ${result.totalImported} registros importados`,
                        details: result
                    });
                } catch (error) {
                    console.error("Erro ao importar dados:", error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error("Erro ao ler arquivo:", error);
                reject(new Error("Erro ao ler arquivo"));
            };
            
            reader.readAsText(file);
        });
    }
    
    // Limpar todos os dados do banco
    async function clearDatabase() {
        if (!initializationComplete) {
            await initializeDatabase();
        }
        
        try {
            const result = await localDB.clearAllData();
            return {
                success: true,
                message: `Banco de dados limpo: ${result.collectionsCleared} coleções afetadas`,
                details: result
            };
        } catch (error) {
            console.error("Erro ao limpar banco de dados:", error);
            return {
                success: false,
                message: `Erro ao limpar banco de dados: ${error.message}`,
                error: error
            };
        }
    }

    // Expor funções globalmente para compatibilidade
    window.saveData = saveData;
    window.updateData = updateData;
    window.fetchData = fetchData;
    window.deleteData = deleteData;
    window.initializeDatabase = initializeDatabase;
    window.checkConnection = checkConnection;
    
    // Novas funções de exportação/importação
    window.exportDatabaseToJSON = exportDatabaseToJSON;
    window.importDatabaseFromJSON = importDatabaseFromJSON;
    window.clearDatabase = clearDatabase;
    
    // Função de compatibilidade para verificação
    window.isFirestoreConnected = async function() {
        return true; // Sempre está "conectado" pois é local
    }

    // Inicializar o banco de dados
    initializeDatabase()
        .then(() => console.log("Inicialização do banco de dados concluída"))
        .catch(error => console.error("Falha na inicialização do banco de dados:", error));
}