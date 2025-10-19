# Booking Bot MVP

Plataforma end-to-end para administrar turnos de un negocio desde un panel web y un bot de WhatsApp. El repositorio contiene un backend en TypeScript/Express conectado a Firebase Firestore y un frontend en React + Vite orientado a la gestión operativa. Además, se incluye un bot basado en `whatsapp-web.js` que permite validar el flujo conversacional de reserva de turnos. El backend está preparado para desplegarse en Render (plan gratuito) como servicio Node.js.

## Tabla de contenidos

- [Arquitectura general](#arquitectura-general)
- [Tecnologías clave](#tecnologías-clave)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Preparación del entorno](#preparación-del-entorno)
- [Backend (Express + Firestore)](#backend-express--firestore)
  - [Variables de entorno](#variables-de-entorno)
  - [Scripts disponibles](#scripts-disponibles)
  - [Endpoints principales](#endpoints-principales)
  - [Bot de WhatsApp](#bot-de-whatsapp)
- [Frontend (React + Vite)](#frontend-react--vite)
  - [Variables de entorno del frontend](#variables-de-entorno-del-frontend)
  - [Scripts de desarrollo](#scripts-de-desarrollo)
- [Flujo de trabajo recomendado](#flujo-de-trabajo-recomendado)
- [Pruebas manuales sugeridas](#pruebas-manuales-sugeridas)
- [Despliegue en Render](#despliegue-en-render)
- [Próximos pasos / Roadmap](#próximos-pasos--roadmap)
- [Licencia](#licencia)

## Arquitectura general

```
frontend/  → Panel web de administración (React + Vite)
backend/   → API REST (Express + Firebase Admin SDK) + Bot de WhatsApp
Firestore  → Persistencia de turnos y servicios (colecciones `bookings`, `services`)
```

- El **backend** expone endpoints REST para crear/listar/eliminar turnos y gestionar servicios. Gestiona la lógica de negocio (validación de horarios, sugerencia de turnos disponibles, etc.).
- El **frontend** consume dicha API para permitir que el equipo admin stee y monitoree turnos desde un navegador.
- El **bot de WhatsApp** se conecta al backend para ejecutar la misma lógica vía chat, validando el MVP conversacional.

## Tecnologías clave

- **Backend**: Node.js 18+, Express, TypeScript, Firebase Admin SDK, whatsapp-web.js, ts-node.
- **Frontend**: React 18+, TypeScript, Vite, CSS modularizado.
- **Infraestructura**: Firestore como base de datos documental.

## Estructura del monorepo

```
booking-bot/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Configuración de Express
│   │   ├── index.ts               # Punto de entrada, inicializa API y bot
│   │   ├── bot/whatsappBot.ts     # Lógica del bot conversacional
│   │   ├── controllers/           # Capas REST por recurso
│   │   ├── services/              # Acceso a Firestore y lógica de negocio
│   │   ├── models/                # Tipados compartidos en el backend
│   │   └── utils/                 # Utilidades (logger, HttpError, etc.)
│   ├── package.json               # Scripts y dependencias del backend
│   └── README.md                  # Documentación específica del backend
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Layout principal
│   │   ├── pages/Dashboard.tsx    # Panel de administración
│   │   ├── components/            # Formularios y listados reutilizables
│   │   ├── services/              # Cliente HTTP hacia el backend
│   │   └── types/                 # Tipos compartidos con la API
│   ├── vite.config.ts             # Configuración de build
│   └── package.json               # Scripts del frontend
└── README.md                      # Este archivo
```

## Preparación del entorno

1. **Requisitos previos**

   - Node.js 18 o superior.
   - Cuenta de Firebase con un proyecto y credenciales de servicio con acceso a Firestore.
   - Navegador Google Chrome (para el bot de WhatsApp con Puppeteer).

2. **Clonar el repositorio**

   ```bash
   git clone git@github.com:<usuario>/booking-bot.git
   cd booking-bot
   ```

3. **Instalar dependencias**

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Configurar variables de entorno**
  - Copia `backend/.env.example` a `backend/.env` y completa los campos obligatorios.
  - Si el frontend requiere variables (por ejemplo la URL del backend), crea `frontend/.env` siguiendo el esquema que se muestra en `frontend/.env.example`.

## Backend (Express + Firestore)

### Variables de entorno

`backend/.env`

```dotenv
PORT=3000
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Bot de WhatsApp (opcional, pero necesario para pruebas)
WHATSAPP_ENABLED=true
WHATSAPP_SESSION_PATH=.wwebjs_auth
WHATSAPP_BROWSER_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
```

- `WHATSAPP_ENABLED`: activa el bot al iniciar el servidor.
- `WHATSAPP_SESSION_PATH`: carpeta donde se guarda la sesión (para evitar re-escanear el QR).
- `WHATSAPP_BROWSER_PATH`: ruta al ejecutable de Chrome/Chromium.

### Scripts disponibles

Ejecutados desde `booking-bot/backend/`:

- `npm run dev`: levanta el servidor con `ts-node --files` (incluye el bot si está habilitado).
- `npm run typecheck`: valida tipos con `tsc --noEmit`.
- `npm run build`: compila TypeScript hacia `dist/` (modo producción).
- `npm run start`: ejecuta la build compilada (`node dist/index.js`). Render usa estos dos scripts.

### Endpoints principales

| Método | Ruta            | Descripción                               |
| ------ | --------------- | ----------------------------------------- |
| POST   | `/bookings`     | Crea un turno si el horario está libre.   |
| GET    | `/bookings`     | Lista turnos ordenados por fecha y hora.  |
| DELETE | `/bookings/:id` | Elimina un turno existente.               |
| GET    | `/services`     | Lista servicios disponibles.              |
| POST   | `/services`     | Crea un servicio (bootstrap desde panel). |

### Bot de WhatsApp

- Implementado en `src/bot/whatsappBot.ts` con `whatsapp-web.js`.
- Flujo guiado de reserva:
  1. Saludo → el bot ofrece iniciar una reserva.
  2. Solicita fecha (formato `YYYY-MM-DD`, validando que sea mayor o igual al día actual).
  3. Solicita hora (formato `HH:mm`, validando rango 09:00–19:00).
  4. Comprueba disponibilidad; sugiere horarios alternativos si el slot está ocupado.
  5. Crea el turno en Firestore reutilizando `bookingService`.
- Comandos útiles:
  - `menu`, `help`, `ayuda`: muestra ayuda general.
  - `reservar turno`: inicia el flujo guiado.
  - `cancelar`: termina la conversación actual.
  - `servicios`, `turnos`: listados rápidos.
  - `reservar Nombre|Servicio|YYYY-MM-DD|HH:mm|Telefono`: creación directa (legacy/test).
- **Emparejamiento**: al correr `npm run dev`, se mostrará un QR en la terminal. Escanear desde la app de WhatsApp (Configuración → Dispositivos vinculados → Vincular un dispositivo). Mantener la terminal abierta.
- **Sesiones**: los datos se guardan en `.wwebjs_auth/`. Para forzar un nuevo escaneo, eliminar esa carpeta (o la ruta configurada).

## Frontend (React + Vite)

### Variables de entorno del frontend

Crear `frontend/.env` con al menos:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

Ajustar según el host/puerto del backend.

### Scripts de desarrollo

Desde `booking-bot/frontend/`:

- `npm run dev`: inicia el servidor Vite (por defecto en `http://localhost:5173`).
- `npm run build`: genera artefactos de producción.
- `npm run preview`: sirve la build resultante.
- `npm run lint` / `npm run test` (si se habilitan) para validaciones adicionales.

El panel principal (`Dashboard`) permite:

- Crear turnos manuales (formulario `BookingForm`).
- Listar y eliminar turnos (`BookingList`).
- Crear y listar servicios (`ServiceList`).

Todos los servicios front se conectan a la API REST del backend; los tipos (`frontend/src/types`) reflejan la estructura de Firestore/Express.

## Flujo de trabajo recomendado

1. `npm run dev` en `backend/` (y escanear QR si se probará el bot).
2. `npm run dev` en `frontend/` para la interfaz sobre `http://localhost:5173`.
3. Usar el panel para crear servicios y turnos de prueba; verificar en Firestore.
4. Interactuar con el bot desde un número de WhatsApp real.
5. Ajustar la lógica en `services/bookingService.ts` o componentes front según feedback.

## Pruebas manuales sugeridas

- **Backend API**: utilizar `curl` o herramientas tipo Postman para ejercitar los endpoints (`POST /bookings`, `DELETE /bookings/:id`, etc.).
- **Frontend**: validar que el panel actualice estados tras crear/eliminar turnos y servicios.
- **Bot**: enviar mensajes desde otro dispositivo/usuario:
  - Saludo → inicio de flujo.
  - Reserva con horario ocupado para ver sugerencias.
  - Comando `cancelar` en medio de la conversación.
  - Comandos `servicios` y `turnos`.

## Próximos pasos / Roadmap

- Añadir selección dinámica del servicio durante la conversación (actualmente toma el primero disponible).
- Persistir historial de conversaciones o auditoría.
- Autenticación en el panel web.
- Despliegue controlado (Render, Railway o similares).

## Despliegue en Render

1. **Repository → Render**: conecta tu cuenta de Render con el repositorio y crea un nuevo *Web Service* apuntando a la carpeta `backend/`.
2. **Configuración**:
  - *Build Command*: `npm install && npm run build`
  - *Start Command*: `npm run start`
  - *Root Directory*: `backend`
  - *Environment*: Node
3. **Variables de entorno**: replica el contenido de `backend/.env` dentro del panel de Render (especialmente las credenciales de Firebase).
4. Render asignará automáticamente una URL pública (`https://<tu-app>.onrender.com`). Configura en el frontend una variable `VITE_API_BASE_URL` apuntando a `https://<tu-app>.onrender.com/api` y reconstruye/depliega el front.
- Tests automatizados (unitarios en backend/frontend, pruebas e2e para el flujo de reservas).
- Webhooks o integración con calendarización externa.

## Licencia

Este proyecto se distribuye como MVP personal. Desarrollado y diseñado por Miguel Miguez.
