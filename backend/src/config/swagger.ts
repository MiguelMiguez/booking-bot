const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Booking Bot API",
    version: "1.0.0",
    description:
      "Documentación de la API utilizada por el panel de Booking Bot. Permite administrar turnos y servicios disponibles para el asistente de WhatsApp.",
    contact: {
      name: "Booking Bot",
      url: "https://booking-bot-wpp.web.app",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Entorno local",
    },
    {
      url: "https://booking-bot-lhrx.onrender.com/api",
      description: "Producción",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Monitoreo y estado del servicio.",
    },
    {
      name: "Bookings",
      description:
        "Administración de turnos (creación, listado y eliminación).",
    },
    {
      name: "Services",
      description: "Administración de servicios ofrecidos en el bot.",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description:
          "Clave del API utilizada para autenticar la solicitud. Define el rol (admin o user) y los permisos disponibles.",
      },
    },
    schemas: {
      Booking: {
        type: "object",
        properties: {
          id: { type: "string", example: "booking_123" },
          name: { type: "string", example: "Juan Pérez" },
          service: { type: "string", example: "Corte clásico" },
          date: {
            type: "string",
            format: "date",
            example: "2025-10-15",
          },
          time: {
            type: "string",
            example: "11:30",
            description: "Hora en formato HH:mm",
          },
          phone: {
            type: "string",
            example: "+54 9 11 5555-5555",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-01T14:20:00.000Z",
          },
        },
        required: [
          "id",
          "name",
          "service",
          "date",
          "time",
          "phone",
          "createdAt",
        ],
      },
      CreateBookingInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          service: { type: "string" },
          date: { type: "string", format: "date" },
          time: { type: "string", example: "11:30" },
          phone: { type: "string" },
        },
        required: ["name", "service", "date", "time", "phone"],
        example: {
          name: "Juan Pérez",
          service: "Corte clásico",
          date: "2025-10-25",
          time: "11:30",
          phone: "+54 9 11 5555-5555",
        },
      },
      Service: {
        type: "object",
        properties: {
          id: { type: "string", example: "service_123" },
          name: { type: "string", example: "Manicura" },
          description: {
            type: "string",
            example: "Servicio completo de manicura",
          },
          durationMinutes: { type: "integer", example: 60 },
          price: { type: "number", example: 1500 },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-01T14:20:00.000Z",
          },
        },
        required: ["id", "name", "createdAt"],
      },
      CreateServiceInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          durationMinutes: { type: "integer" },
          price: { type: "number" },
        },
        required: ["name"],
        example: {
          name: "Limpieza facial",
          description: "Tratamiento de limpieza profunda con hidratación",
          durationMinutes: 45,
          price: 1800,
        },
      },
      UpdateServiceInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          durationMinutes: { type: "integer", minimum: 1 },
          price: { type: "number", minimum: 0 },
        },
        description:
          "Campos opcionales para editar un servicio existente. Se puede enviar uno o varios.",
        example: {
          name: "Corte premium",
          durationMinutes: 60,
          price: 2200,
        },
      },
      UpdateBookingInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          service: { type: "string" },
          date: { type: "string", format: "date" },
          time: { type: "string", example: "11:30" },
          phone: { type: "string" },
        },
        description:
          "Campos opcionales para editar un turno existente. Se puede enviar uno o varios.",
        example: {
          name: "Juan Pérez",
          date: "2025-10-26",
          time: "14:00",
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Ruta no encontrada" },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "Lista todos los turnos registrados",
        description: "Disponible para roles admin y user.",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: "Listado de turnos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Booking" },
                },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Bookings"],
        summary: "Crea un nuevo turno",
        description: "Requiere rol admin.",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBookingInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Turno creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Booking" },
              },
            },
          },
          400: {
            description: "Datos inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Permisos insuficientes (se requiere rol admin)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/bookings/{id}": {
      patch: {
        tags: ["Bookings"],
        summary: "Actualiza un turno existente",
        description: "Requiere rol admin.",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Identificador del turno a actualizar",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateBookingInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Turno actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Booking" },
              },
            },
          },
          400: {
            description: "Solicitud inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Permisos insuficientes (se requiere rol admin)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Turno no encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "El horario ya no está disponible",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Bookings"],
        summary: "Elimina un turno existente",
        description: "Requiere rol admin.",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Identificador del turno",
          },
        ],
        responses: {
          204: {
            description: "Turno eliminado",
          },
          400: {
            description: "Solicitud inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Turno no encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Permisos insuficientes (se requiere rol admin)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/services": {
      get: {
        tags: ["Services"],
        summary: "Lista los servicios configurados",
        description: "Disponible para roles admin y user.",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: "Listado de servicios",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Service" },
                },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Services"],
        summary: "Crea un nuevo servicio",
        description: "Requiere rol admin.",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateServiceInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Servicio creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Service" },
              },
            },
          },
          400: {
            description: "Datos inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Permisos insuficientes (se requiere rol admin)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/services/{id}": {
      put: {
        tags: ["Services"],
        summary: "Actualiza un servicio existente",
        description: "Requiere rol admin.",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Identificador del servicio a actualizar",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateServiceInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Servicio actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Service" },
              },
            },
          },
          400: {
            description: "Solicitud inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Permisos insuficientes (se requiere rol admin)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Servicio no encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Services"],
        summary: "Elimina un servicio",
        description: "Requiere rol admin.",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Identificador del servicio a eliminar",
          },
        ],
        responses: {
          204: {
            description: "Servicio eliminado",
          },
          400: {
            description: "Solicitud inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Autenticación requerida o clave inválida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Permisos insuficientes (se requiere rol admin)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Servicio no encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Error inesperado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verifica el estado del servicio",
        servers: [
          {
            url: "http://localhost:3000",
            description: "Endpoint público de health check",
          },
          {
            url: "https://booking-bot-lhrx.onrender.com",
            description: "Producción",
          },
        ],
        responses: {
          200: {
            description: "Servicio operativo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                },
              },
            },
          },
        },
        security: [],
      },
    },
  },
};

export default swaggerDocument;
