# Booking Bot Backend

Backend inicial en TypeScript + Express conectado a Firebase Firestore para gestionar turnos y servicios. Sirve como base para integraciones con bots de mensajería y paneles web de administración.

## Requisitos previos

- Node.js 18 o superior
- Cuenta de Firebase con un proyecto configurado y credenciales de servicio

## Configuración

1. Clonar o descargar este repositorio.
2. Entrar en la carpeta `backend/` y instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar el archivo `.env.example` a `.env` y completar los valores:
   ```bash
   cp .env.example .env
   ```
4. En `FIREBASE_PRIVATE_KEY` respeta los saltos de línea. Si la clave viene en una sola línea, reemplaza `\n` por saltos de línea reales o deja la cadena entre comillas con los `\n` escapados.

## Scripts disponibles

- `npm run dev`: levanta el servidor con `ts-node`.
- `npm run typecheck`: ejecuta `tsc --noEmit` para validar tipos.

## Integración con WhatsApp (MVP)

El backend incorpora un bot experimental con `whatsapp-web.js` para validar flujos desde WhatsApp. Para activarlo:

1. Define en `.env` las variables opcionales:
   ```bash
   WHATSAPP_ENABLED=true
   # WHATSAPP_SESSION_PATH=.wwebjs_auth        # Opcional, directorio donde se guardará la sesión
   # WHATSAPP_BROWSER_PATH="C:/Ruta/a/chrome.exe"  # Opcional, ruta a un navegador Chromium específico
   ```
2. Ejecuta `npm install` si aún no agregaste las dependencias nuevas.
3. Inicia el servidor (`npm run dev`). En consola aparecerá un QR: escanéalo con la app de WhatsApp para vincular la cuenta de prueba.

### Comandos disponibles en el chat

- `menu` / `help` / `ayuda`: muestra las instrucciones.
- `servicios`: obtiene la lista actual de servicios desde Firestore.
- `turnos`: responde con los próximos turnos registrados (máximo 5).
- `reservar Nombre|Servicio|YYYY-MM-DD|HH:mm|Telefono`: crea un turno rápido validando la disponibilidad.

> El bot ignora mensajes enviados por sí mismo y mensajes en grupos. Para reiniciar la sesión borra la carpeta configurada en `WHATSAPP_SESSION_PATH`.

## Ejecución en desarrollo

```bash
npm run dev
```

El servidor queda disponible en `http://localhost:3000` (o el puerto definido en `PORT`).

## Endpoints iniciales

- `POST /bookings` crea un turno si el horario está disponible.
- `GET /bookings` lista todos los turnos.
- `DELETE /bookings/:id` elimina un turno existente.
- `GET /services` lista los servicios disponibles.
- `POST /services` crea un servicio (pensado para pruebas y bootstrap).

## Estructura del proyecto

```
/src
 ├── index.ts
 ├── config/
 ├── controllers/
 ├── routes/
 ├── services/
 ├── models/
 └── utils/
```

Cada capa mantiene responsabilidades separadas para favorecer la escalabilidad y facilitar futuras integraciones con otros canales o tipos de negocio.
