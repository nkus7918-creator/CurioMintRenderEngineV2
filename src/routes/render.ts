import { Router } from "express";
import { renderController } from "../controllers/render.controller";

const router = Router();

router.post("/", renderController);

export default router;