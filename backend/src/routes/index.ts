import { Router } from "express";
import bookingRoutes from "./bookingRoutes";
import serviceRoutes from "./serviceRoutes";

const router = Router();

router.use("/bookings", bookingRoutes);
router.use("/services", serviceRoutes);

export default router;
