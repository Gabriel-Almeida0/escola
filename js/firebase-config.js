// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkjHFruepcEQAdryRLEE1hI94mjXMQkmc",
  authDomain: "escola-app-6201b.firebaseapp.com",
  projectId: "escola-app-6201b",
  storageBucket: "escola-app-6201b.firebasestorage.app",
  messagingSenderId: "1728411931",
  appId: "1:1728411931:web:cd9e7251ed44807eebbbbe",
  measurementId: "G-EBSD0TW4Q3"
};

// Detectar se estamos em uma extensão Chrome
const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// Variáveis globais
let app;
let db;
let auth;
let storage;
let analytics = null;
let isConnected = false;
let connectionStatusListener = null;
let initializationComplete = false;
let initializationPromise = null;

// Função para inicializar o Firebase de forma assíncrona
async function initializeFirebase() {
    // Se já existe uma promessa de inicialização em andamento, retorna ela
    if (initializationPromise) {
        return initializationPromise;
    }
    
    // Cria uma nova promessa de inicialização
    initializationPromise = new Promise(async (resolve, reject) => {
        try {
            console.log("Iniciando inicialização do Firebase...");
            
            // Limpar qualquer listener de conexão anterior
            if (connectionStatusListener) {
                connectionStatusListener();
                connectionStatusListener = null;
            }
            
            // Inicializar Firebase usando a API modular
            const { initializeApp, getFirestore, getAuth, getStorage } = window.firebaseModules;
            
            // Inicializar o app Firebase
            app = initializeApp(firebaseConfig);
            console.log("Firebase App inicializado");
            
            // Inicializar serviços
            auth = getAuth(app);
            storage = getStorage(app);
            
            // Importar módulos Firestore dinamicamente
            const { 
                getFirestore: getFirestoreModule, 
                enableIndexedDbPersistence, 
                CACHE_SIZE_UNLIMITED,
                collection, 
                doc, 
                getDoc, 
                onSnapshot,
                addDoc,
                updateDoc,
                deleteDoc,
                query,
                where,
                orderBy,
                limit,
                serverTimestamp
            } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
            
            // Inicializar Firestore
            db = getFirestoreModule(app);
            
            // Salvar funções importantes para uso global
            window.firestoreFunctions = {
                collection, 
                doc, 
                getDoc, 
                onSnapshot,
                addDoc,
                updateDoc,
                deleteDoc,
                query,
                where,
                orderBy,
                limit,
                serverTimestamp
            };
            
            // Configurações diferentes para extensão Chrome vs. aplicação web
            if (isExtension) {
                console.log("Configurando Firebase para ambiente de extensão Chrome");
                
                // Não tentar usar persistência em extensões para evitar problemas
                console.log("Persistência desativada para extensão Chrome");
            } else {
                console.log("Configurando Firebase para ambiente web padrão");
                
                // Tentar habilitar persistência offline apenas para web
                try {
                    await enableIndexedDbPersistence(db);
                    console.log("Persistência offline habilitada com sucesso");
                } catch (err) {
                    if (err.code === 'failed-precondition') {
                        console.warn('Persistência falhou: Múltiplas abas abertas');
                    } else if (err.code === 'unimplemented') {
                        console.warn('Persistência não suportada neste navegador');
                    } else {
                        console.error('Erro ao configurar persistência:', err);
                    }
                }
            }
            
            // Configurar monitoramento de conexão
            setupConnectionMonitoring();
            
            // Marcar como inicializado
            initializationComplete = true;
            isConnected = true; // Assumir conectado inicialmente
            
            // Notificar que o Firebase foi inicializado
            document.dispatchEvent(new CustomEvent('firestore-connected'));
            
            console.log("Firebase inicializado com sucesso!");
            resolve(true);
        } catch (error) {
            console.error("Erro crítico ao inicializar o Firebase:", error);
            document.dispatchEvent(new CustomEvent('firestore-disconnected', { 
                detail: { message: 'Falha na inicialização do Firebase: ' + error.message } 
            }));
            initializationComplete = false;
            isConnected = false;
            reject(error);
        }
    });
    
    return initializationPromise;
}

// Configurar monitoramento de conexão
async function setupConnectionMonitoring() {
    if (!db) return;
    
    // Limpar listener anterior se existir
    if (connectionStatusListener) {
        connectionStatusListener();
    }
    
    try {
        // Importar funções necessárias
        const { doc, onSnapshot } = window.firestoreFunctions;
        
        // Monitorar estado de conexão usando o Firestore
        const statusDoc = doc(db, '__connectionStatus__', 'status');
        connectionStatusListener = onSnapshot(statusDoc, () => {
            isConnected = true;
            console.log('Conectado ao Firebase Firestore');
            document.dispatchEvent(new CustomEvent('firestore-connected'));
        }, (error) => {
            isConnected = false;
            console.error('Erro de conexão com o Firestore:', error);
            document.dispatchEvent(new CustomEvent('firestore-disconnected', { 
                detail: { message: error.message || 'Erro de conexão com o Firestore' } 
            }));
        });
    } catch (error) {
        console.error('Não foi possível configurar monitoramento de conexão:', error);
        
        // Usar verificação periódica como fallback
        setInterval(() => {
            if (navigator.onLine) {
                checkFirestoreConnection();
            }
        }, 30000); // Verificar a cada 30 segundos
    }
    
    // Verificar conectividade com a internet
    window.addEventListener('online', () => {
        console.log('Dispositivo está online');
        setTimeout(() => checkFirestoreConnection(), 1000); // Atraso para estabilização da conexão
    });
    
    window.addEventListener('offline', () => {
        console.log('Dispositivo está offline');
        isConnected = false;
        document.dispatchEvent(new CustomEvent('firestore-disconnected', { 
            detail: { message: 'Dispositivo está offline' } 
        }));
    });
}

// Iniciar o processo de inicialização imediatamente
initializeFirebase().catch(error => {
    console.error("Falha na inicialização do Firebase:", error);
});

// Função para verificar conectividade com o Firestore
async function isFirestoreConnected() {
    // Garantir que o Firebase esteja inicializado
    if (!initializationComplete) {
        try {
            await initializeFirebase();
        } catch (error) {
            console.warn("Erro ao inicializar Firebase:", error);
            return false;
        }
    }
    
    // Verificações básicas
    if (!db) return false;
    if (!navigator.onLine) return false;
    
    return isConnected;
}

// Função para verificar a conexão com o Firestore
async function checkFirestoreConnection() {
    // Garantir que o Firebase esteja inicializado
    if (!initializationComplete || !db) {
        try {
            await initializeFirebase();
        } catch (error) {
            console.warn("Não foi possível inicializar o Firebase:", error);
            isConnected = false;
            document.dispatchEvent(new CustomEvent('firestore-disconnected', { 
                detail: { message: 'Falha ao inicializar o Firebase' } 
            }));
            return false;
        }
    }
    
    // Verificar se o dispositivo está online
    if (!navigator.onLine) {
        isConnected = false;
        document.dispatchEvent(new CustomEvent('firestore-disconnected', { 
            detail: { message: 'Dispositivo está offline' } 
        }));
        return false;
    }
    
    try {
        // Importar funções necessárias
        const { collection, doc, getDoc } = window.firestoreFunctions;
        
        // Verificar conexão apenas com uma operação de leitura (mais segura que escrita)
        const testRef = doc(db, '__connectionTest__', 'test');
        
        // Tentar ler o documento (não importa se existe ou não)
        await getDoc(testRef);
        
        isConnected = true;
        console.log('Conexão com o Firestore verificada com sucesso');
        document.dispatchEvent(new CustomEvent('firestore-connected'));
        return true;
    } catch (error) {
        isConnected = false;
        console.error('Erro ao verificar conexão com o Firestore:', error);
        document.dispatchEvent(new CustomEvent('firestore-disconnected', { 
            detail: { message: 'Erro de conexão com o Firestore' } 
        }));
        return false;
    }
}

// Função para salvar dados com melhor tratamento de erros
async function saveData(collectionName, data) {
    // Garantir que o Firebase esteja inicializado
    if (!initializationComplete) {
        try {
            await initializeFirebase();
        } catch (error) {
            console.error("Erro ao inicializar Firebase para salvar dados:", error);
            throw new Error("Firebase não está inicializado");
        }
    }
    
    try {
        if (!db) {
            throw new Error("Firestore não está inicializado");
        }
        
        // Verificar conectividade antes de tentar salvar
        if (!isConnected && navigator.onLine) {
            await checkFirestoreConnection();
            
            // Se ainda não estiver conectado após a verificação, lança erro
            if (!isConnected) {
                throw new Error("Sem conexão com o Firestore");
            }
        }
        
        // Importar funções necessárias
        const { collection, addDoc, serverTimestamp } = window.firestoreFunctions;
        
        // Adicione timestamp de criação e atualização
        const dataWithTimestamp = {
            ...data,
            updatedAt: serverTimestamp(),
            createdAt: data.createdAt || serverTimestamp()
        };
        
        // Remover campos undefined ou funções que podem causar erros
        Object.keys(dataWithTimestamp).forEach(key => {
            if (dataWithTimestamp[key] === undefined || typeof dataWithTimestamp[key] === 'function') {
                delete dataWithTimestamp[key];
            }
        });
        
        const collectionRef = collection(db, collectionName);
        const docRef = await addDoc(collectionRef, dataWithTimestamp);
        console.log(`Documento adicionado com ID: ${docRef.id}`);
        return docRef.id;
    } catch (e) {
        console.error(`Erro ao adicionar documento em ${collectionName}:`, e);
        throw e;
    }
}

// Função para atualizar dados existentes com melhor tratamento de erros
async function updateData(collectionName, docId, data) {
    // Garantir que o Firebase esteja inicializado
    if (!initializationComplete) {
        try {
            await initializeFirebase();
        } catch (error) {
            console.error("Erro ao inicializar Firebase para atualizar dados:", error);
            throw new Error("Firebase não está inicializado");
        }
    }
    
    try {
        if (!db) {
            throw new Error("Firestore não está inicializado");
        }
        
        // Verificar conectividade antes de tentar atualizar
        if (!isConnected && navigator.onLine) {
            await checkFirestoreConnection();
            
            // Se ainda não estiver conectado após a verificação, lança erro
            if (!isConnected) {
                throw new Error("Sem conexão com o Firestore");
            }
        }
        
        // Importar funções necessárias
        const { doc, updateDoc, serverTimestamp } = window.firestoreFunctions;
        
        // Adicione timestamp de atualização
        const dataWithTimestamp = {
            ...data,
            updatedAt: serverTimestamp()
        };
        
        // Remover campos undefined ou funções que podem causar erros
        Object.keys(dataWithTimestamp).forEach(key => {
            if (dataWithTimestamp[key] === undefined || typeof dataWithTimestamp[key] === 'function') {
                delete dataWithTimestamp[key];
            }
        });
        
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, dataWithTimestamp);
        console.log(`Documento atualizado: ${docId}`);
        return docId;
    } catch (e) {
        console.error(`Erro ao atualizar documento em ${collectionName}:`, e);
        throw e;
    }
}

// Função para buscar dados com melhor tratamento de erros
async function fetchData(collectionName, filters = {}, lim = 100) {
    // Garantir que o Firebase esteja inicializado
    if (!initializationComplete) {
        try {
            await initializeFirebase();
        } catch (error) {
            console.error("Erro ao inicializar Firebase para buscar dados:", error);
            throw new Error("Firebase não está inicializado");
        }
    }
    
    // Se ainda não tiver db após inicialização, falha rápida
    if (!db) {
        throw new Error("Firestore não está inicializado");
    }
    
    try {
        // Importar funções necessárias
        const { collection, query, where, orderBy, limit: limitFn, getDocs } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
        
        // Configurar a consulta
        let collectionRef = collection(db, collectionName);
        let constraints = [];
        
        // Aplicar filtros
        if (filters.where) {
            constraints.push(where(filters.where[0], filters.where[1], filters.where[2]));
        }
        
        // Aplicar ordenação
        if (filters.orderBy) {
            constraints.push(orderBy(filters.orderBy[0], filters.orderBy[1] || 'asc'));
        }
        
        // Aplicar limite
        if (lim) {
            constraints.push(limitFn(lim));
        }
        
        // Criar a consulta
        const q = query(collectionRef, ...constraints);
        
        // Simplificar a estratégia de busca para evitar erros
        try {
            // Usar modo padrão que decide automaticamente entre cache e servidor
            const querySnapshot = await getDocs(q);
            console.log(`Dados de ${collectionName} obtidos (${querySnapshot.size} documentos)`);
            
            // Processar resultados
            const results = [];
            querySnapshot.forEach((doc) => {
                // Converter timestamp para ISO string para compatibilidade
                const data = doc.data();
                Object.keys(data).forEach(key => {
                    if (data[key] && typeof data[key].toDate === 'function') {
                        data[key] = data[key].toDate().toISOString();
                    }
                });
                
                results.push({ id: doc.id, ...data });
            });
            
            console.log(`Busca concluída em ${collectionName}: ${results.length} documentos`);
            return results;
        } catch (error) {
            console.error(`Erro ao buscar ${collectionName}:`, error);
            // Retornar array vazio em caso de falha
            return [];
        }
    } catch (e) {
        console.error(`Erro ao buscar documentos em ${collectionName}:`, e);
        throw e;
    }
}

// Função para excluir dados
async function deleteData(collectionName, docId) {
    // Garantir que o Firebase esteja inicializado
    if (!initializationComplete) {
        try {
            await initializeFirebase();
        } catch (error) {
            console.error("Erro ao inicializar Firebase para excluir dados:", error);
            throw new Error("Firebase não está inicializado");
        }
    }
    
    try {
        if (!db) {
            throw new Error("Firestore não está inicializado");
        }
        
        // Verificar conectividade antes de tentar excluir
        if (!isConnected && navigator.onLine) {
            await checkFirestoreConnection();
            
            // Se ainda não estiver conectado após a verificação, lança erro
            if (!isConnected) {
                throw new Error("Sem conexão com o Firestore");
            }
        }
        
        // Importar funções necessárias
        const { doc, deleteDoc } = window.firestoreFunctions;
        
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        console.log(`Documento excluído: ${docId}`);
        return true;
    } catch (e) {
        console.error(`Erro ao excluir documento em ${collectionName}:`, e);
        throw e;
    }
}

// Limpar o listener de conexão quando a página for fechada
window.addEventListener('beforeunload', () => {
    if (connectionStatusListener) {
        connectionStatusListener();
    }
});
