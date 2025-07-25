// Updated Campaign Controller (derived from JobController)
import mongoose from "mongoose";
import { bucket } from "../config/storage.js";
import Campaign from "../models/CampaignModel.js";
import User from "../models/User.js";
import {
  generateJobCreateEmailHTML,
  assignedJobEmailHTML,
  statusChangedJobEmailHTML,
  firstJobApprovedEmailHTML,
  generateCampaingnCreateEmailHTML,
  updatedCampaignStatusEmailHTML,
  assignedCampaignEmailHTML
} from "../constants/emailTemplate.js";
import { sendEmail } from "../utils/emailService.js";
import { ZONES } from "../../frontend/src/utils/constants.js";

const JOB_STATUS = ["inprogress", "artwork submitted", "publish artwork"];
const DECISION_STATUS = ["approved", "under review", "review rejected", "artwork approved", "hold", "ho approved"];

export const createCampaign = async (req, res) => {
  try {
    const { title, typeOfCampaign, zone, campaignDetails, offerDetails, attachment, dueDate } = req.body;
    console.log(req.body)

    const newCampaign = new Campaign({
      title,
      zone,
      typeOfCampaign,
      campaignDetails,
      offerDetails,
      attachment,
      dueDate,
      createdBy: req.user.userId,
      finalStatus: "campaign-created",
      decisionHistory: [{ status: "campaign-created", updatedBy: req.user.userId }]
    });

    await newCampaign.save();

    const html = generateCampaingnCreateEmailHTML({
      campaign: newCampaign,
      created: req.user.name,
      adminPanelLink: `https://www.adbee.in/campaigns/${newCampaign._id}`
    });

    const otherUsers = await User.find({
      role: { $in: ["admin", "marketing_manager", "zonal_marketing_manager", "brand_manager"] },
      _id: { $ne: req.user.userId }
    }).select('email');

    const createdByUser = await User.findById(newCampaign.createdBy).select('email');
    const assignedToUser = await User.findById(newCampaign.assignedTo).select('email');

    const emailSet = new Set([
      ...otherUsers.map(u => u.email).filter(Boolean),
      createdByUser?.email,
      assignedToUser?.email
    ]);


    const emails = Array.from(emailSet).filter(Boolean);
    // const emails = ['harderavi@gmail.com', 'sainathdandawate@bigital.co.in'];
    await sendEmail({ to: emails, subject: `New campaign Created: ${newCampaign.title}`, html });

    res.status(201).json({ success: true, campaign: newCampaign });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", zone } = req.query;

    const query = {};

    if (search.trim().length >= 3) {
      query.title = { $regex: search.trim(), $options: "i" };
    }
    if (zone) {
      query.zone = zone;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, totalCount] = await Promise.all([
      Campaign.find(query)
        .populate("createdBy", "firstName lastName email")
        .populate("designAssignedTo", "firstName lastName email")
        .populate("publishAssignedTo", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Campaign.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    console.log()
    res.status(200).json({
      success: true,
      campaigns: campaigns,
      totalCount,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("designAssignedTo", "firstName lastName email profilePic")
      .populate("publishAssignedTo", "firstName lastName email profilePic")
      .populate("statusHistory.updatedBy", "firstName lastName email profilePic")
      .populate("decisionHistory.updatedBy", "firstName lastName email profilePic");

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Helper function to safely generate signed URLs
    const getSignedUrlSafe = async (filePath) => {
      if (filePath && typeof filePath === 'string' && filePath.trim() !== '') {
        try {
          return await generateSignedUrl(filePath);
        } catch (err) {
          console.error("Signed URL generation error:", err);
        }
      }
      return null;
    };

    // Attach signed URL for main attachment
    if (campaign.attachment) {
      campaign._doc.attachment = await getSignedUrlSafe(campaign.attachment);
    }

    // Attach signed URLs for statusHistory
    for (const entry of campaign.statusHistory) {
      if (entry.attachment) {
        entry._doc.attachment = await getSignedUrlSafe(entry.attachment);
      }
    }

    // Attach signed URLs for decisionHistory
    for (const entry of campaign.decisionHistory) {
      if (entry.attachment) {
        entry._doc.attachment = await getSignedUrlSafe(entry.attachment);
      }
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateCampaignStatus = async (req, res) => {
  const { id } = req.params;
  const { status, comment, attachment } = req.body;
  const userId = req.user.userId;

  try {
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Add to statusHistory
    campaign.statusHistory.push({
      status,
      updatedBy: userId,
      comment,
      attachment,
      timestamp: new Date(),
    });

    // Update finalStatus
    campaign.finalStatus = status;

    // Notify by email
    const updatedByUser = await User.findById(userId).select("firstName lastName email");
    const createdByUser = await User.findById(campaign.createdBy).select("email");

    const otherUsers = await User.find({
      role: { $in: ["admin", "marketing_manager", "zonal_marketing_manager", "brand_manager"] },
      _id: { $ne: userId }
    }).select("email");

    const emailSet = new Set([
      updatedByUser?.email,
      createdByUser?.email,
      ...otherUsers.map((u) => u.email)
    ]);

    if (campaign.designAssignedTo) {
      const designUser = await User.findById(campaign.designAssignedTo).select("email").lean();
      if (designUser?.email) emailSet.add(designUser.email);
    }

    // Add publishAssignedTo email if present
    if (campaign.publishAssignedTo) {
      const publishUser = await User.findById(campaign.publishAssignedTo).select("email").lean();
      if (publishUser?.email) emailSet.add(publishUser.email);
    }

    // For test only one email
    // const emails = ['harderavi@gmail.com', 'sainathdandawate@bigital.co.in'];
    const emails = Array.from(emailSet).filter(Boolean);

    const html = updatedCampaignStatusEmailHTML({
      campaign,
      status,
      comment,
      updatedBy: updatedByUser,
      adminPanelLink: `https://www.adbee.in/campaigns/${id}`
    });

    await sendEmail({
      to: emails,
      subject: `Campaign Status Updated: ${campaign.title}`,
      html
    });


    await campaign.save();



    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      updatedStatus: status,
    });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const { assignedTo, role, comment } = req.body;
  const adminId = req.user.userId;

  if (!["design", "publish"].includes(role)) {
    return res.status(400).json({ message: "Invalid role type. Must be 'design' or 'publish'." });
  }

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const currentAssignedId = role === "design" ? campaign.designAssignedTo : campaign.publishAssignedTo;

    const alreadyAssigned =
      campaign.decisionHistory.some(
        (entry) =>
          entry.status === (role === "design" ? "assigned-content" : "assigned-publishing") &&
          String(currentAssignedId) === assignedTo
      );

    if (!alreadyAssigned) {
      const now = new Date();

      // ✅ Assign user
      if (role === "design") {
        campaign.designAssignedTo = assignedTo;
      } else {
        campaign.publishAssignedTo = assignedTo;
      }

      // ✅ Push history with correct status
      const statusLabel = role === "design" ? "assigned-content" : "assigned-publishing";
      campaign.decisionHistory.push({
        status: statusLabel,
        comment: comment || "",
        updatedBy: adminId,
        timestamp: now
      });

      // ✅ Update final status
      campaign.finalStatus = statusLabel;

      // Notify by email
      const assignedUser = await User.findById(assignedTo).select("firstName lastName email");
      const createdByUser = await User.findById(campaign.createdBy).select("email");

      const otherUsers = await User.find({
        role: { $in: ["admin", "marketing_manager", "zonal_marketing_manager", "brand_manager"] },
        _id: { $ne: req.user.userId }
      }).select("email");

      const emailSet = new Set([
        assignedUser?.email,
        createdByUser?.email,
        ...otherUsers.map((u) => u.email)
      ]);
      const emails = Array.from(emailSet).filter(Boolean);
      // const emails = ['harderavi@gmail.com', 'sainathdandawate@bigital.co.in'];
      const html = assignedCampaignEmailHTML({
        campaign,
        assigned: { by: req.user.name, to: assignedUser },
        adminPanelLink: `https://www.adbee.in/campaigns/${campaignId}`

      });

      await sendEmail({
        to: emails,
        subject: `Campaign Assigned for ${role}: ${campaign.title}`,
        html
      });

      await campaign.save();
    }

    res.status(200).json({ message: `User assigned successfully for ${role}`, campaign });
  } catch (error) {
    console.error("Error assigning campaign:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const deletedCampaign = await Campaign.findByIdAndDelete(req.params.id);

    if (!deletedCampaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateSignedUrl = async (url) => {
  try {
    const decodedUrl = decodeURIComponent(url);
    const baseUrl = "https://storage.googleapis.com/mahindra_adbee_strg/";
    const filePath = decodedUrl.replace(baseUrl, "").split('?')[0];
    const file = bucket.file(filePath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 60 * 1000
    });
    return signedUrl;
  } catch (err) {
    console.error("Signed URL generation failed:", err);
    return null;
  }
};


