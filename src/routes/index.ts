import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import galleryRouter from "./gallery.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(galleryRouter);

export default router;
