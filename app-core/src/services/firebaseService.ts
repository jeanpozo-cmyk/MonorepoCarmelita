// app-core/src/services/firebaseService.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- Configuración de Entorno (VITE_) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 1. Inicializa Firebase (una sola vez)
const app = initializeApp(firebaseConfig);

// 2. Exporta los servicios públicos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // Obtener el servicio de funciones

// 3. Wrapper para llamar a Cloud Functions de forma segura
/**
 * Envuelve la llamada a una Firebase Callable Function.
 * @param functionName Nombre exacto de la función en el backend (ej: 'aiHealthCheck')
 * @param data Datos a enviar a la función
 * @returns La respuesta de la función
 */
export async function callBackendFunction<T>(
  functionName: string,
  data?: any
): Promise<T> {
  try {
    const callable = httpsCallable<any, T>(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Error llamando a la función ${functionName}:`, error);
    // Manejo de errores centralizado
    throw new Error(`Fallo del servicio: ${functionName}`);
  }
}

// 4. Prueba de Conectividad con la IA del Backend
export async function testAIConnection() {
  try {
    // Llama a la función onCall que creaste en functions/src/index.ts
    const result = await callBackendFunction<{status: string, message: string}>('aiHealthCheck');
    console.log("AI Health Check Result:", result);
    return result;
  } catch (error) {
    console.error("Fallo la conexión con el backend AI.");
    return { status: 'ERROR', message: 'Fallo la conexión con Cloud Functions.' };
  }
}
