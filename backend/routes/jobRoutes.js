import express from "express";
import { authenticate} from "../controllers/userController.js";
import { approveJob, createJob, deleteJob, getAllJobs, getExternalUsers, getJobById, jobassignedTo, updateJobStatus } from "../controllers/jobController.js";

const router = express.Router();

router.get("/external-users",authenticate, getExternalUsers);

router.get("/:id", authenticate, getJobById);

router.post("/:jobId/approve", authenticate, approveJob);

router.post("/:jobId/update-status", authenticate, updateJobStatus);

router.post("/create", authenticate, createJob);
router.get("/", authenticate, getAllJobs);
router.delete("/:id", authenticate, deleteJob);

router.post("/:jobId/assign", authenticate, jobassignedTo)



export default router;
