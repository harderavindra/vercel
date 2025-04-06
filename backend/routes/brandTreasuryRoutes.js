import express from "express";
import { authenticate} from "../controllers/userController.js";
import { createBrandTreasury, getBrandTreasuries, getBrandTreasuryById, toggleStarred , uploadThumbnail} from "../controllers/brandTreasuryController.js";

const router = express.Router();

router.get("/", authenticate, getBrandTreasuries);
router.get("/get-brandtreasury/:fileId", authenticate, getBrandTreasuryById);
router.put('/update-thumbnail/:fileId', authenticate, uploadThumbnail);

router.post("/create", authenticate, createBrandTreasury);
router.patch("/star/:documentId", authenticate, toggleStarred);


export default router;
