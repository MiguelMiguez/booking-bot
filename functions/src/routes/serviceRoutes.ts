import { Router } from "express";
import {
  handleCreateService,
  handleListServices,
} from "../controllers/serviceController";

const router = Router();

router.get("/", handleListServices);
router.post("/", handleCreateService);

export default router;
