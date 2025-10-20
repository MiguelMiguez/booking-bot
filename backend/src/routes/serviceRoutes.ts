import { Router } from "express";
import {
  handleCreateService,
  handleListServices,
} from "../controllers/serviceController";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/", authorize("admin", "user"), handleListServices);
router.post("/", authorize("admin"), handleCreateService);

export default router;
