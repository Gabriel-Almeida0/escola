// Importar Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, collection, addDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Configuração do Firebase (substitua com suas credenciais reais do console Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyBkjHFruepcEQAdryRLEE1hI94mjXMQkmc",
  authDomain: "escola-app-6201b.firebaseapp.com",
  projectId: "escola-app-6201b",
  storageBucket: "escola-app-6201b.firebasestorage.app",
  messagingSenderId: "1728411931",
  appId: "1:1728411931:web:cd9e7251ed44807eebbbbe",
  measurementId: "G-EBSD0TW4Q3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Habilitar persistence offline para minimizar consultas online
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not supported');
    }
  });

// Adicione analytics apenas se estiver em ambiente compatível
let analytics;
try {
  // Verificar se estamos em um ambiente que suporta analytics
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.log('Analytics não disponível neste ambiente');
}

// Função otimizada para salvar dados (usa addDoc para escrita única)
export const saveData = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

// Função otimizada para ler dados (usa getDocs com query limitada para minimizar leituras)
export const fetchData = async (collectionName, filters = {}, lim = 10) => {
  try {
    let q = query(collection(db, collectionName), limit(lim));
    if (filters.where) {
      q = query(q, where(...filters.where));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching documents: ", e);
    return [];
  }
};

// Exportar db para uso avançado se necessário
export { db }; 