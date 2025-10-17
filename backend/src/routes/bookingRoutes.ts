import { Router } from "express";
import {
  handleCreateBooking,
  handleDeleteBooking,
  handleListBookings,
} from "../controllers/bookingController";

const router = Router();

router.post("/", handleCreateBooking);
router.get("/", handleListBookings);
router.delete("/:id", handleDeleteBooking);

export default router;
