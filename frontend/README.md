# Booking Bot - Panel de Administración (Frontend)

Panel de administración web para el sistema **Booking Bot**, una aplicación de gestión de turnos y servicios. Permite a los administradores y operadores gestionar reservas, servicios y visualizar métricas en tiempo real.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Funcionalidades por Página](#-funcionalidades-por-página)
- [Componentes Principales](#-componentes-principales)
- [Sistema de Autenticación](#-sistema-de-autenticación)
- [Servicios (API Client)](#-servicios-api-client)
- [Deploy con Firebase](#-deploy-con-firebase)

---

## ✨ Características

- **Dashboard interactivo** con métricas y gráficos de turnos
- **Gestión completa de turnos** (CRUD): crear, editar, eliminar y listar
- **Gestión de servicios** con tarjetas visuales e iconos dinámicos
- **Sistema de roles**: Administrador y Operador
- **Autenticación por API Key** con persistencia opcional (recordarme)
- **Interfaz responsive** optimizada para desktop y móvil
- **Notificaciones toast** para feedback de acciones
- **Tablas de datos** con búsqueda, ordenamiento y paginación (MUI DataGrid)
- **Gráficos interactivos** con Recharts (turnos por día, servicios más solicitados)
- **Modales reutilizables** para formularios dinámicos
- **Diálogos de confirmación** para acciones destructivas

---

## 🛠 Tecnologías

| Categoría         | Tecnología                   |
| ----------------- | ---------------------------- |
| **Framework**     | React 19                     |
| **Lenguaje**      | TypeScript 5.9               |
| **Build Tool**    | Vite 7                       |
| **Routing**       | React Router DOM 6           |
| **UI Components** | Material UI (MUI) 6          |
| **Data Grid**     | MUI X Data Grid 7            |
| **Gráficos**      | Recharts 3                   |
| **Iconos**        | Lucide React                 |
| **Backend**       | Firebase (Firestore)         |
| **Hosting**       | Firebase Hosting             |
| **Linting**       | ESLint 9 + TypeScript ESLint |

---

## 🏗 Arquitectura del Proyecto

```
frontend/
├── public/              # Archivos estáticos
├── src/
│   ├── assets/          # Recursos (imágenes, fuentes)
│   ├── components/      # Componentes reutilizables
│   ├── contexts/        # React Contexts (Auth)
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Páginas/Vistas principales
│   ├── services/        # Clientes API y servicios
│   ├── types/           # Definiciones TypeScript
│   ├── utils/           # Utilidades y helpers
│   ├── App.tsx          # Componente raíz con rutas
│   ├── main.tsx         # Punto de entrada
│   └── firebase.ts      # Configuración de Firebase
├── .env                 # Variables de entorno (no versionado)
├── .env.example         # Plantilla de variables de entorno
├── firebase.json        # Configuración de Firebase (en raíz del proyecto)
├── package.json         # Dependencias y scripts
├── tsconfig.json        # Configuración TypeScript
└── vite.config.ts       # Configuración de Vite
```

---

## 📦 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x o **yarn** >= 1.22
- **Firebase CLI** (para deploy)

```bash
npm install -g firebase-tools
```

---

## 🚀 Instalación

1. **Clonar el repositorio:**

   ```bash
   git clone <url-del-repositorio>
   cd booking-bot/frontend
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con tus credenciales de Firebase y URL del backend.

4. **Iniciar servidor de desarrollo:**

   ```bash
   npm run dev
   ```

5. **Abrir en el navegador:**
   ```
   http://localhost:5173
   ```

---

## 🔐 Variables de Entorno

Crear un archivo `.env` en la carpeta `frontend/` con las siguientes variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY="tu-api-key"
VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tu-proyecto"
VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc123"

# Backend API URL
VITE_API_BASE_URL="https://tu-backend.onrender.com/api"
```

> **Nota:** Las variables con prefijo `VITE_` son expuestas al cliente. No incluir secretos sensibles.

---

## 📜 Scripts Disponibles

| Comando           | Descripción                                     |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Inicia el servidor de desarrollo con HMR        |
| `npm run build`   | Compila TypeScript y genera build de producción |
| `npm run preview` | Previsualiza el build de producción localmente  |
| `npm run lint`    | Ejecuta ESLint para verificar el código         |

---

## 📁 Estructura de Carpetas

### `/src/components/`

Componentes reutilizables organizados por funcionalidad:

| Componente           | Descripción                                        |
| -------------------- | -------------------------------------------------- |
| `Charts/`            | Contenedor y tooltips para gráficos Recharts       |
| `ConfirmDialog/`     | Diálogo de confirmación para acciones destructivas |
| `DashboardHeader/`   | Encabezado con título, subtítulo y estadísticas    |
| `DashboardMetrics/`  | Gráficos de métricas (turnos por día, servicios)   |
| `DataTable/`         | Tabla de datos con MUI DataGrid + acciones         |
| `Modal/`             | Modal genérico con formularios dinámicos           |
| `Navbar/`            | Barra de navegación lateral responsive             |
| `NotificationToast/` | Sistema de notificaciones toast                    |
| `ServiceCard/`       | Tarjeta visual para mostrar un servicio            |
| `ServiceList/`       | Lista de servicios en formato grid                 |

### `/src/pages/`

Vistas principales de la aplicación:

| Página       | Ruta        | Descripción                            |
| ------------ | ----------- | -------------------------------------- |
| `Dashboard/` | `/`         | Vista principal con métricas y resumen |
| `Login/`     | N/A         | Pantalla de inicio de sesión           |
| `Services/`  | `/services` | Gestión de servicios (CRUD)            |
| `Turnos/`    | `/turnos`   | Gestión de turnos/reservas (CRUD)      |

### `/src/services/`

Clientes para comunicación con el backend:

| Servicio            | Descripción                                                 |
| ------------------- | ----------------------------------------------------------- |
| `apiClient.ts`      | Cliente HTTP base con interceptores                         |
| `authStorage.ts`    | Persistencia de autenticación (localStorage/sessionStorage) |
| `bookingService.ts` | CRUD de turnos                                              |
| `serviceService.ts` | CRUD de servicios                                           |

---

## 📄 Funcionalidades por Página

### 🏠 Dashboard (`/`)

- **Estadísticas generales**: Total de turnos, próximos, históricos
- **Gráfico de turnos por día** (últimos 7 días)
- **Gráfico de servicios más solicitados**
- **Gráfico de distribución** (próximos vs históricos)
- **Tabla de últimos turnos** con acciones rápidas
- **Lista de servicios disponibles**

### 📅 Turnos (`/turnos`)

- **Listado completo de turnos** con tabla paginada
- **Búsqueda y filtrado** por nombre, teléfono, servicio, fecha
- **Crear nuevo turno** (solo admin)
- **Editar turno existente** (solo admin)
- **Eliminar turno** con confirmación (solo admin)
- **Métricas**: turnos de hoy, próximos, históricos

### 🛠 Servicios (`/services`)

- **Grid de servicios** con tarjetas visuales
- **Iconos dinámicos** basados en el nombre del servicio
- **Crear nuevo servicio** (solo admin)
- **Editar servicio** (solo admin)
- **Eliminar servicio** con confirmación (solo admin)
- **Información**: nombre, descripción, duración, precio

### 🔑 Login

- **Autenticación por API Key**
- **Selección de rol**: Administrador / Operador
- **Opción "Recordarme"** para persistir sesión
- **Validación de permisos** según el rol seleccionado

---

## 🧩 Componentes Principales

### `DataTable`

Tabla de datos basada en MUI X DataGrid con:

- Búsqueda rápida (QuickFilter)
- Ordenamiento por columnas
- Paginación configurable
- Acciones por fila (editar, eliminar)
- Diálogo de confirmación integrado

### `Modal`

Modal genérico para formularios con:

- Campos dinámicos (text, email, tel, number, date, time, select, textarea)
- Validación de campos requeridos
- Estado de carga (submitting)
- Manejo de errores
- Animaciones de entrada/salida

### `DashboardMetrics`

Panel de métricas con gráficos:

- **AreaChart**: Turnos creados por día
- **BarChart horizontal**: Servicios más reservados
- **BarChart**: Distribución próximos/históricos
- Estados de carga y vacío

---

## 🔒 Sistema de Autenticación

### Roles disponibles

| Rol               | Permisos                            |
| ----------------- | ----------------------------------- |
| **Administrador** | CRUD completo de turnos y servicios |
| **Operador**      | Solo lectura de listados y métricas |

### Flujo de autenticación

1. Usuario ingresa API Key y selecciona rol
2. Se valida la API Key contra el endpoint `/services`
3. Para rol admin, se verifica acceso a `/bookings` (POST)
4. Credenciales se guardan en localStorage/sessionStorage
5. El token se envía en header `x-api-key` en cada request

### AuthContext

```typescript
interface AuthContextValue {
  apiKey: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
}
```

---

## 🌐 Servicios (API Client)

### Configuración base

```typescript
// URL del backend (automática en producción)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
```

### Endpoints consumidos

| Método | Endpoint        | Descripción                |
| ------ | --------------- | -------------------------- |
| GET    | `/bookings`     | Listar todos los turnos    |
| POST   | `/bookings`     | Crear nuevo turno          |
| PATCH  | `/bookings/:id` | Actualizar turno           |
| DELETE | `/bookings/:id` | Eliminar turno             |
| GET    | `/services`     | Listar todos los servicios |
| POST   | `/services`     | Crear nuevo servicio       |
| PUT    | `/services/:id` | Actualizar servicio        |
| DELETE | `/services/:id` | Eliminar servicio          |

---

## 🚀 Deploy con Firebase

### Configuración inicial (una sola vez)

1. **Iniciar sesión en Firebase CLI:**

   ```bash
   firebase login
   ```

2. **Inicializar proyecto** (si no está configurado):
   ```bash
   firebase init hosting
   ```
   - Seleccionar proyecto existente o crear uno nuevo
   - Directorio público: `frontend/dist`
   - Configurar como SPA: **Sí**
   - No sobreescribir `index.html`

### Deploy a producción

1. **Desde la carpeta raíz del proyecto** (`booking-bot/`):

   ```bash
   # Ir a la carpeta frontend
   cd frontend

   # Instalar dependencias (si es necesario)
   npm install

   # Generar build de producción
   npm run build

   # Volver a la raíz del proyecto
   cd ..

   # Desplegar a Firebase Hosting
   firebase deploy --only hosting
   ```

2. **Comando rápido** (desde la raíz):
   ```bash
   cd frontend && npm run build && cd .. && firebase deploy --only hosting
   ```

### Verificar deploy

Después del deploy, Firebase mostrará la URL de producción:

```
✔ Deploy complete!
Hosting URL: https://tu-proyecto.web.app
```

### Configuración de Firebase (`firebase.json`)

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", ".firebaserc", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### Comandos útiles de Firebase

| Comando                                   | Descripción                           |
| ----------------------------------------- | ------------------------------------- |
| `firebase deploy --only hosting`          | Deploy solo del hosting               |
| `firebase hosting:channel:deploy preview` | Deploy a canal de preview             |
| `firebase hosting:channel:list`           | Listar canales de preview             |
| `firebase hosting:channel:delete preview` | Eliminar canal de preview             |
| `firebase serve --only hosting`           | Servidor local con config de Firebase |

---

## 📊 Tipos de Datos

### Booking (Turno)

```typescript
interface Booking {
  id: string;
  name: string; // Nombre del cliente
  service: string; // Nombre del servicio
  date: string; // Fecha (YYYY-MM-DD)
  time: string; // Hora (HH:mm)
  phone: string; // Teléfono del cliente
  createdAt: string; // Fecha de creación
}
```

### Service (Servicio)

```typescript
interface Service {
  id: string;
  name: string; // Nombre del servicio
  description?: string; // Descripción opcional
  durationMinutes?: number; // Duración en minutos
  price?: number; // Precio
  icon?: string; // Icono personalizado
  createdAt: string; // Fecha de creación
}
```

### UserRole

```typescript
type UserRole = "admin" | "user";
```

---

## 📝 Licencia

Este proyecto es privado y de uso exclusivo para Miguel Miguez.

---

## 👥 Contacto

Para soporte o consultas, miguelmiguezangel@gmail.com .
