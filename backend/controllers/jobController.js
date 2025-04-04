import mongoose from "mongoose";
import { bucket } from "../config/storage.js";
import Job from "../models/JobModel.js";
import User from "../models/User.js";

const JOB_STATUS = ["Inprogress", "Hold", "Submited"];
const DECISION_STATUS = ["Created", "Approved", "Assigned", "Completed", "Rejected", "Resubmitted"];
export const createJob = async (req, res) => {
  try {
    const { title, type, priority, offerType, zone, state, language, product, brand, model, offerDetails, otherDetails, attachment, dueDate } = req.body;
    console.log(req.user)

    const newJob = new Job({
      title,
      type,
      priority,
      offerType,
      zone,
      state,
      language,
      product,
      brand,
      model,
      offerDetails,
      otherDetails,
      attachment,
      dueDate,
      decisionHistory: [{ status: "Created", updatedBy: req.user.userId }] // Auto-add initial status
    });

    await newJob.save();
    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getAllJobs = async (req, res) => {
  try {
    let { page = 1, limit = 2, search,priority,languages } = req.query;

    console.log('getAllJobs', page)

    let filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { language: { $regex: search, $options: "i" } }
      ];
    }
    if (priority) filter.priority = priority;
    if (languages) {
      const languagesArray = languages.split(",");
      if (languagesArray.length > 0) {
          filter.language = { $in: languagesArray };
      }
  }


    // Convert limit and page to integers
    const perPage = parseInt(limit, 10);
    const skip = (page - 1) * perPage;

    const jobs = await Job.find(filter)
      .skip(skip)
      .sort({ createdAt: -1 })
      .limit(perPage)
      .populate('decisionHistory.updatedBy', 'firstName lastName email profilePic')
      .populate({ path: 'createdBy', select: 'firstName lastName profilePic role' })
      .populate('statusHistory.updatedBy', 'firstName lastName email profilePic')
      .populate('assignedTo', 'firstName email profilePic');

    const totalJobs = await Job.countDocuments(filter);


    const jobsWithSignedUrls = await Promise.all(jobs.map(async (job) => {
      // Find the "Created" status entry
      const createdStatus = job.decisionHistory.find(entry => entry.status === "Created");
      let createdBy = null;

      if (createdStatus?.updatedBy) {
        let profilePicSignedUrl = null;
        if (createdStatus.updatedBy.profilePic) {
          profilePicSignedUrl = await generateSignedUrl(createdStatus.updatedBy.profilePic);
        }

        createdBy = {
          _id: createdStatus.updatedBy._id,
          email: createdStatus.updatedBy.email,
          firstName: createdStatus.updatedBy.firstName,
          profilePic: profilePicSignedUrl || createdStatus.updatedBy.profilePic,
        };
      }

      let attachmentSignedUrl = null;
      if (job.attachment) {
        attachmentSignedUrl = await generateSignedUrl(job.attachment);
      }

      return {
        ...job.toObject(),
        createdBy,
        attachmentSignedUrl,
      };
    }));

    res.status(200).json({
      data: jobsWithSignedUrls,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalJobs / perPage),
        totalJobs,
      },
    }
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate('decisionHistory.updatedBy', 'firstName lastName email profilePic')
      .populate('statusHistory.updatedBy', 'firstName lastName email profilePic')
      .populate({ path: 'createdBy', select: 'firstName lastName profilePic role' })
      .populate('assignedTo', 'firstName lastName email profilePic');

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    let createdBy = null;
    let approvedBy = null;

    // Find the "Created" status entry
    const createdStatus = job.decisionHistory.find(entry => entry.status === "Created");
    if (createdStatus?.updatedBy) {
      const profilePicSignedUrl = createdStatus.updatedBy.profilePic
        ? await generateSignedUrl(createdStatus.updatedBy.profilePic)
        : null;

      createdBy = {
        _id: createdStatus.updatedBy._id,
        email: createdStatus.updatedBy.email,
        firstName: createdStatus.updatedBy.firstName,
        lastName: createdStatus.updatedBy.lastName,
        profilePic: profilePicSignedUrl || createdStatus.updatedBy.profilePic
      };
    }

    // Find the "Approved" status entry
    const approvedStatus = job.decisionHistory.find(entry => entry.status === "Approved");
    if (approvedStatus?.updatedBy) {
      const profilePicSignedUrl = approvedStatus.updatedBy.profilePic
        ? await generateSignedUrl(approvedStatus.updatedBy.profilePic)
        : null;

      approvedBy = {
        _id: approvedStatus.updatedBy._id,
        email: approvedStatus.updatedBy.email,
        firstName: approvedStatus.updatedBy.firstName,
        lastName: approvedStatus.updatedBy.lastName,
        profilePic: profilePicSignedUrl || approvedStatus.updatedBy.profilePic
      };
    }

    // Generate signed URL for main job attachment
    let attachmentSignedUrl = null;
    if (job.attachment) {
      attachmentSignedUrl = await generateSignedUrl(job.attachment);
    }

    // Generate signed URLs for statusHistory attachments
    const statusHistoryWithSignedUrls = await Promise.all(
      job.statusHistory.map(async (entry) => {
        const attachmentSignedUrl = entry.attachment ? await generateSignedUrl(entry.attachment) : null;
        return {
          ...entry.toObject(),
          attachmentSignedUrl,
        };
      })
    );

    // Generate signed URLs for decisionHistory attachments
    const decisionHistoryWithSignedUrls = await Promise.all(
      job.decisionHistory.map(async (entry) => {
        const attachmentSignedUrl = entry.attachment ? await generateSignedUrl(entry.attachment) : null;
        return {
          ...entry.toObject(),
          attachmentSignedUrl,
        };
      })
    );

    res.status(200).json({
      ...job.toObject(),
      createdBy,
      approvedBy,
      attachmentSignedUrl,
      statusHistory: statusHistoryWithSignedUrls,
      decisionHistory: decisionHistoryWithSignedUrls,
    });

  } catch (error) {
    console.error("Error fetching job by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Utility function to generate signed URL
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

export const approveJob = async (req, res) => {

  try {
    const { jobId } = req.params;
    const adminId = req.user._id; // Assuming user is authenticated


    const job = await Job.findById(jobId);
    console.log(req.params, job);

    if (!job) return res.status(404).json({ error: "Job not found" });

    // Add approval entry in status history
    job.decisionHistory.push({
      status: "Approved",
      updatedBy: adminId,
      date: new Date(),
    });
    job.finalStatus = "Approved";


    await job.save();
    res.status(200).json({ message: "Job approved successfully", job });
  } catch (error) {
    console.error("Error approving job:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateJobStatus = async (req, res) => {

  try {
    const { jobId } = req.params;
    const { status, comment, attachment } = req.body;
    const adminId = req.user.userId;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (DECISION_STATUS.includes(status)) {
      job.decisionHistory.push({
        status,
        comment,
        attachment,
        updatedBy: adminId,
        date: new Date(),
      });
    }

    if (JOB_STATUS.includes(status)) {
      job.statusHistory.push({
        status,
        comment,
        attachment,
        updatedBy: adminId,
        date: new Date(),
      });

    }
    job.finalStatus = status;

    await job.save();
    res.status(200).json({ message: `Job status updated to ${status}`, job });

  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getExternalUsers = async (req, res) => {
  try {
    const externalUsers = await User.find({ role: "agency" }).select("_id firstName profilePic email"); // Fetch only necessary fields
    res.status(200).json(externalUsers);
  } catch (error) {
    console.error("Error fetching external users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const jobassignedTo = async (req, res) => {
  const { jobId } = req.params;
  const { assignedTo, comment } = req.body;  // Add 'comment' in the request body
  const adminId = req.user.userId;

  try {
    // Find and update the job with the new assignedTo
    const job = await Job.findByIdAndUpdate(jobId, { assignedTo }, { new: true });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Push a new entry into the decisionHistory array
    job.decisionHistory.push({
      status: 'Assigned',
      comment: comment || '', // Use the provided comment or an empty string if no comment is provided
      updatedBy: adminId,
      date: new Date(), // Set the current date and time
    });
    job.finalStatus = 'Assigned';

    // Save the updated job document
    await job.save();

    res.status(200).json({ message: "User assigned successfully", job });
  } catch (error) {
    console.error("Error assigning user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if job has an attachment and delete it from GCS
    if (job.attachment) {
      const file = bucket.file(job.attachment);
      try {
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Attachment ${job.attachment} deleted successfully from GCS.`);
        }
      } catch (err) {
        console.error("Error deleting attachment from GCS:", err);
        return res.status(500).json({ error: "Failed to delete job attachment" });
      }
    }

    // Delete job from the database
    await Job.findByIdAndDelete(id);
    res.status(200).json({ message: "Job and its attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};