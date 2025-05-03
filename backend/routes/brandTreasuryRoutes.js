import express from "express";
import { authenticate} from "../controllers/userController.js";
import { createBrandTreasury, deleteBrandTreasuryDocument, deleteThumbnail, getBrandTreasuries, getBrandTreasuryById, toggleStarred , updateApproval, updateBrandTreasury, uploadThumbnail} from "../controllers/brandTreasuryController.js";

const router = express.Router();

router.get("/", authenticate, getBrandTreasuries);
router.get("/get-brandtreasury/:fileId", authenticate, getBrandTreasuryById);
router.put('/update-thumbnail/:fileId', authenticate, uploadThumbnail);
router.post("/:id/approval", authenticate ,updateApproval);

router.post("/create", authenticate, createBrandTreasury);
router.post("/delete-thumbnail", authenticate,deleteThumbnail);
router.patch("/star/:documentId", authenticate, toggleStarred);
router.post("/:id", authenticate,deleteBrandTreasuryDocument);

router.put("/update-brandtreasury/:id", authenticate, updateBrandTreasury);


export default router;
