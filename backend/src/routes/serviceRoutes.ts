import { Router } from "express";
import {
  handleCreateService,
  handleDeleteService,
  handleListServices,
  handleUpdateService,
} from "../controllers/serviceController";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/", authorize("admin", "user"), handleListServices);
router.post("/", authorize("admin"), handleCreateService);
router.put("/:id", authorize("admin"), handleUpdateService);
router.delete("/:id", authorize("admin"), handleDeleteService);

export default router;
