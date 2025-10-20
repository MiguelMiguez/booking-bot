import { Router } from "express";
import {
  handleCreateBooking,
  handleDeleteBooking,
  handleListBookings,
} from "../controllers/bookingController";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/", authorize("admin", "user"), handleListBookings);
router.post("/", authorize("admin"), handleCreateBooking);
router.delete("/:id", authorize("admin"), handleDeleteBooking);

export default router;
