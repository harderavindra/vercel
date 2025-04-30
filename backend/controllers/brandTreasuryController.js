import mongoose from "mongoose";
import BrandTreasury from "../models/BrandTreasury.js";
import StarredDocument from "../models/StarredDocument.js";
import { bucket } from "../config/storage.js";
import { sendEmail } from '../utils/emailService.js';
import User from "../models/User.js";

export const createBrandTreasury = async (req, res) => {
    try {
        const { title, documentType, contentType,  language, product, brand, model, comment, attachment } = req.body;
        console.log(req.user, documentType)

        const newBrandTreasury = new BrandTreasury({
            title,
            documentType,
            contentType,
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
            ? await attachmentSignedUrl(document.attachment)
            : null;

        // Generate signed URL for profile pictures if they exist
        const createdByProfilePicUrl = document.createdBy?.profilePic
            ? await generateSignedUrl(document.createdBy.profilePic)
            : null;

        const approvedByProfilePicUrl = document.approvedBy?.profilePic
            ? await generateSignedUrl(document.approvedBy.profilePic)
            : null;

        res.json({
            _id: document._id,
            title: document.title,
            documentType: document.documentType,
            contentType: document.contentType,
            state: document.state,
            zone: document.zone,
            language: document.language,
            thumbnailUrls: signedThumbnailUrls || null,
            size: signedAttachmentUrl?.size || null,
            mime: signedAttachmentUrl?.mime || null,
            attachment: signedAttachmentUrl,
            product: document.product?.name || null,
            brand: document.brand?.name || null,
            model: document.model?.name || null,
            lastUpdatedBy: document.lastUpdatedBy,
            createdBy: {
                ...document.createdBy?._doc,
                profilePic: createdByProfilePicUrl
            },
            updatedAt: document.updatedAt,
            createdAt: document.createdAt,
            approved: document.approved,
            approvedBy: {
                ...document.approvedBy?._doc,
                profilePic: approvedByProfilePicUrl
            },
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
        let { page = 1, limit = 10, documentType, starred, myDocuments, search, languages } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;

        let filter = {};
        if (userRole !== "marketing_manager") {
            filter.contentType = "print";
        }

        if (documentType) filter.documentType = documentType;
        if (search) {
            filter.$or = [
                { documentType: { $regex: search, $options: "i" } },
                { language: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } }
            ];
        }
        if (myDocuments === "true") {
            filter.createdBy = userId;  // Ensure `createdBy` is stored in the Document model
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

        const updatedDocuments = await Promise.all(
            brandTreasuries.map(async (doc) => {
                const docObj = doc.toObject();

                const signedThumbnails = await Promise.all(
                    (docObj.thumbnailUrls || []).map((url) => generateSignedUrl(url))
                );
                // Generate signed URL for createdBy.profilePic if it exists
                let signedProfilePic = null;
                if (docObj.createdBy?.profilePic) {
                    signedProfilePic = await generateSignedUrl(docObj.createdBy.profilePic);
                }


                return {
                    ...docObj,
                    createdBy: {
                        ...docObj.createdBy,
                        profilePic: signedProfilePic,
                    },
                    thumbnailUrls: signedThumbnails,
                    isStarred: starredIds.includes(doc._id.toString()),
                };
            })
        );


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


export const updateApproval = async (req, res) => {

    const { id } = req.params;
    const { approved } = req.body;
    const userId = req.user.userId; // Get logged-in user ID from middleware

    try {
        const updateData = { approved };

        // If approved, set approvedBy and approvedAt; otherwise, reset them
        if (approved) {
            updateData.approvedBy = userId;
            updateData.approvedAt = new Date();
        } else {
            updateData.approvedBy = null;
            updateData.approvedAt = null;
        }

        // Use $set to ensure all fields update properly
        const document = await BrandTreasury.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, upsert: false } // Don't create a new document if not found
        );

        if (!document) {
            return res.status(404).json({ error: "Document not found." });
        }
        // Get all admin emails
    const admins = await User.find({ role: 'admin' }).select('email');
    const adminEmails = admins.map((user) => user.email).filter(Boolean);

    // Send email notification
    const subject = `Document ${approved ? 'Approved' : 'Unapproved'} - ${document.title}`;
    const html = `
     <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <div style="text-align: center; padding: 20px; background-color: #f5f5f5;">
        <img src="https://adbee.in/wp-content/uploads/2024/01/mahindra-tractor-logo.png" alt="Mahindra Logo" style="max-width: 150px;" />
      </div>

      <div style="padding: 20px;">
        <h2 style="color: #333333;">Approval Status Updated</h2>
        <p style="color: #555555;">Dear Admin,</p>
        <p>
          The status of a document in the Brand Treasury system has been <strong>updated</strong> by a team member.
        </p>
        <p>
          Please log in to your admin panel to view the changes and take any necessary action.
        </p>
        <div style="text-align: center; margin-top: 25px;">
          <a href="https://yourdomain.com/admin-panel" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View in Admin Panel
          </a>
        </div>
      </div>

      <div style="text-align: center; font-size: 12px; color: #888888; padding: 20px;">
        © ${new Date().getFullYear()} Mahindra Brand Treasury. All rights reserved.
      </div>

    </div>
  </div>
    `;

    await sendEmail({ to: adminEmails, subject, html });

        res.json({ success: true, document });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Database update failed." });
    }
};



export const deleteBrandTreasuryDocument = async (req, res) => {
    try {
        const { id, attachment, thumbnailUrls } = req.body;
        console.log("Received for deletion:", { id, attachment, thumbnailUrls });

        const BASE_URL = "https://storage.googleapis.com/brand-treasury/";

        // 1. Delete main attachment file
        if (attachment) {
            const decodedUrl = decodeURIComponent(attachment);
            const filePath = decodedUrl.replace(BASE_URL, "").split("?")[0];
            console.log("Deleting attachment:", filePath);
            const file = bucket.file(filePath);
            await file.delete().catch(err => {
                console.warn(`Failed to delete attachment: ${filePath}`, err.message);
            });
        }

        // 2. Delete thumbnail files
        if (Array.isArray(thumbnailUrls)) {
            for (const thumbUrl of thumbnailUrls) {
                const decodedUrl = decodeURIComponent(thumbUrl);
                const filePath = decodedUrl.replace(BASE_URL, "").split("?")[0];
                console.log("Deleting thumbnail:", filePath);
                const file = bucket.file(filePath);
                await file.delete().catch(err => {
                    console.warn(`Failed to delete thumbnail: ${filePath}`, err.message);
                });
            }
        }

        // 3. Delete MongoDB document
        const deletedDoc = await BrandTreasury.findByIdAndDelete(id);
        if (!deletedDoc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        return res.status(200).json({ message: 'Document and all files deleted successfully.' });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
export const deleteThumbnail = async (req, res) => {
    try {
        const { fileId, imageUrl } = req.body;

        if (!fileId || !imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'fileId and imageUrl are required',
            });
        }

        // Decode the URL
        const decodedUrl = decodeURIComponent(imageUrl);
        const baseUrl = "https://storage.googleapis.com/brand-treasury/";
        const filePath = decodedUrl.replace(baseUrl, "").split('?')[0];

        // Remove query params to get the stored version
        const strippedImageUrl = decodedUrl.split("?")[0];

        // Delete from Google Cloud Storage
        const file = bucket.file(filePath);
        await file.delete().catch(err => {
            console.warn(`Error deleting file from GCS: ${filePath}`, err.message);
        });

        // Remove thumbnail from MongoDB
        const updatedDoc = await BrandTreasury.findByIdAndUpdate(
            fileId,
            { $pull: { thumbnailUrls: strippedImageUrl } },
            { new: true }
        );

        if (!updatedDoc) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Thumbnail deleted successfully',
            updatedDoc,
        });

    } catch (error) {
        console.error("Error deleting thumbnail:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

const generateSignedUrl = async (url) => {
    try {
        const decodedUrl = decodeURIComponent(url);
        const baseUrl = "https://storage.googleapis.com/mahindra_adbee_strg/";
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
const attachmentSignedUrl = async (url) => {
    try {
        const decodedUrl = decodeURIComponent(url);
        const baseUrl = "https://storage.googleapis.com/mahindra_adbee_strg/";
        const filePath = decodedUrl.replace(baseUrl, "").split('?')[0];
        const file = bucket.file(filePath);

        // Generate a signed URL
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
        });

        // Get metadata
        const [metadata] = await file.getMetadata();

        return { signedUrl, size: metadata.size, mime: metadata.contentType };
    } catch (err) {
        console.error(`Error generating signed URL: `, err);
        return null;
    }
};