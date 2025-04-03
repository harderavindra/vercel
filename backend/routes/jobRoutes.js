import express from "express";
import { authenticate} from "../controllers/userController.js";
import { createJob, getAllJobs } from "../controllers/jobController.js";

const router = express.Router();
router.post("/create", authenticate, createJob);
router.get("/", authenticate, getAllJobs);

export default router;
