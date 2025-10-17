import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase, leída desde las variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

// Inicializar la app de Firebase
const app = initializeApp(firebaseConfig);

// Exportar la instancia de Firestore para usarla en otros componentes
// Esta es la variable que importarás para hacer consultas
export const db = getFirestore(app);
