import cors, { type CorsOptions } from "cors";
import express, { type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./utils/logger";
import swaggerDocument from "./config/swagger";
import { authenticate } from "./middlewares/authenticate";

const app = express();

const corsOptions: CorsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);
app.get("/docs.json", (_req: Request, res: Response) => {
  res.json(swaggerDocument);
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Booking Bot API",
    docs: "/docs",
    health: "/health",
  });
});

app.use("/api", authenticate, routes);

app.use((req: Request, res: Response) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

export default app;
