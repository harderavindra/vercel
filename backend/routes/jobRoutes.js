import express from "express";
import { authenticate} from "../controllers/userController.js";
import { createJob } from "../controllers/jobController.js";

const router = express.Router();
router.post("/create", authenticate, createJob);

export default router;
