import mongoose from "mongoose";
import BrandTreasury from "../models/BrandTreasury.js";
import StarredDocument from "../models/StarredDocument.js";
import { bucket } from "../config/storage.js";

export const createBrandTreasury = async (req, res) => {
    try {
        const { title, documentType, contentType, zone, state, language, product, brand, model, comment, attachment } = req.body;
        console.log(req.user, documentType)

        const newBrandTreasury = new BrandTreasury({
            title,
            documentType,
            contentType,
            zone,
            state,
            language,
            product,
            brand,
            model,
            comment,

            attachment,
            createdBy: req.user.userId,
            decisionHistory: [{ status: "Created", updatedBy: req.user.userId }] // Auto-add initial status
        });

        await newBrandTreasury.save();
        console.log(newBrandTreasury, "newBrandTreasury")
        res.status(201).json({ success: true, brandTreasury: newBrandTreasury });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const uploadThumbnail = async (req, res) => {
    const { fileId } = req.params;
    const { thumbnailUrl: publicUrl } = req.body;
  
    try {
      // Find the document by ID
      const document = await BrandTreasury.findById(fileId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
  
      // Limit to 4 thumbnails
      if (document.thumbnailUrls && document.thumbnailUrls.length >= 4) {
        return res.status(400).json({ error: "Maximum 4 thumbnails allowed" });
      }
  
      // Save the public URL
      document.thumbnailUrls = [...(document.thumbnailUrls || []), publicUrl];
      await document.save();
  
      // Generate a signed URL for the uploaded file
      const signedUrl = await generateSignedUrl(publicUrl);
  
      if (!signedUrl) {
        return res.status(500).json({ error: "Failed to generate signed URL" });
      }
  
      return res.json({
        message: "Thumbnail uploaded successfully",
        thumbnailUrl: signedUrl,
      });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      return res.status(500).json({ error: "Server error. Please try again later." });
    }
  };
  

  export const getBrandTreasuryById = async (req, res) => {
    try {
      const { fileId } = req.params;
      const userId = req.user.userId;
  
      const document = await BrandTreasury.findById(fileId)
        .populate({ path: 'product', select: 'name' })
        .populate({ path: 'brand', select: 'name' })
        .populate({ path: 'model', select: 'name' })
        .populate({ path: 'lastUpdatedBy', select: 'firstName lastName profilePic role' })
        .populate({ path: 'createdBy', select: 'firstName lastName profilePic role' })
        .populate({ path: 'approvedBy', select: 'firstName lastName profilePic role' });
  
      if (!document) {
        return res.status(404).json({ error: "File not found" });
      }
  
      const isStarred = await StarredDocument.exists({ userId, documentId: fileId });
  
      // Generate signed URLs for thumbnail images
      const signedThumbnailUrls = await Promise.all(
        (document.thumbnailUrls || []).map((url) => generateSignedUrl(url))
      );
  
      // Generate signed URL for attachment if exists
      const signedAttachmentUrl = document.attachment
        ? await generateSignedUrl(document.attachment)
        : null;
  
      res.json({
        _id: document._id,
        title: document.title,
        documentType: document.documentType,
        contentType: document.contentType,
        thumbnailUrls: signedThumbnailUrls,
        attachment: signedAttachmentUrl,
        product: document.product?.name || null,
        brand: document.brand?.name || null,
        model: document.model?.name || null,
        lastUpdatedBy: document.lastUpdatedBy,
        createdBy: document.createdBy,
        updatedAt: document.updatedAt,
        createdAt: document.createdAt,
        approved: document.approved,
        approvedBy: document.approvedBy,
        approvedAt: document.approvedAt,
        isStarred: !!isStarred,
        comment: document?.comment,
      });
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
  

export const getBrandTreasuries = async (req, res) => {
    try {
        let { page = 1, limit = 10, documentType, starred,myDocuments, search ,languages } = req.query;
        console.log(languages ,"lectedLanguages")
        const userId = req.user.userId;

        let filter = {};
        
        if (documentType) filter.documentType = documentType;
        if (search) {
            filter.$or = [
                { documentType: { $regex: search, $options: "i" } },
                { language: { $regex: search, $options: "i" } }
            ];
        }
        if (myDocuments === "true") {
            console.log(myDocuments , "myDocuments")
            filter.lastUpdatedBy = userId;  // Ensure `createdBy` is stored in the Document model
        }

        if (languages) {
            const languagesArray = languages.split(",");
            if (languagesArray.length > 0) {
                filter.language = { $in: languagesArray };
            }
        }

        // Convert limit and page to integers
        const perPage = parseInt(limit, 10);
        const skip = (page - 1) * perPage;

        let starredIds = [];

        // If starred=true, filter only starred documents
        if (starred === "true") {
            const starredDocuments = await StarredDocument.find({ userId });
            starredIds = starredDocuments.map(doc => doc.documentId.toString());
            filter._id = { $in: starredIds }; // Apply filter to fetch only starred documents
        }

        // Fetch documents
        const brandTreasuries = await BrandTreasury.find(filter)
            .skip(skip)
            .sort({ createdAt: -1 }) 
            .limit(perPage)
            .populate('createdBy', 'firstName lastName location profilePic');

        // If starred=false or not provided, fetch starred document IDs separately
        if (starred !== "true") {
            const starredDocuments = await StarredDocument.find({ userId });
            starredIds = starredDocuments.map(doc => doc.documentId.toString()); // Convert to array
        }

        // Add `isStarred` field to each document
        const updatedDocuments = brandTreasuries.map(doc => ({
            ...doc.toObject(),
            isStarred: starredIds.includes(doc._id.toString()) // Now always an array
        }));

        // Count total documents
        const totalDocuments = await BrandTreasury.countDocuments(filter);
        
        res.status(200).json({
            data: updatedDocuments,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalDocuments / perPage),
                totalDocuments,
            },
        });
    } catch (error) {
        console.error("Error fetching Brand Treasury:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const toggleStarred = async (req, res) => {
    try {
        const { documentId } = req.params;
        const userId = req.user.userId; // Assuming you're using authentication middleware
        console.log(userId)
        // Check if the document is already starred by the user
        const existingStarred = await StarredDocument.findOne({ userId, documentId });

        if (existingStarred) {
            // If already starred, remove it (unstar)
            await StarredDocument.deleteOne({ userId, documentId });
            return res.status(200).json({ message: "Document unstarred successfully", isStarred: false });
        } else {
            // If not starred, add it to the starred list
            const newStarred = new StarredDocument({ userId, documentId });
            await newStarred.save();
            return res.status(200).json({ message: "Document starred successfully", isStarred: true });
        }
    } catch (error) {
        console.error("Error toggling starred document:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


const generateSignedUrl = async (url) => {
  try {
    const decodedUrl = decodeURIComponent(url);
    const baseUrl = "https://storage.googleapis.com/brand-treasury/";
    const filePath = decodedUrl.replace(baseUrl, "").split('?')[0];
    const file = bucket.file(filePath);

    // Generate a signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    });

    return signedUrl;
  } catch (err) {
    console.error(`Error generating signed URL: `, err);
    return null;
  }
};