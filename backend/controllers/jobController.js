import mongoose from "mongoose";
import { bucket } from "../config/storage.js";
import Job from "../models/JobModel.js";
import User from "../models/User.js";
import { assignedJobEmailHTML, generateJobCreateEmailHTML, statusChangedJobEmailHTML } from "../constants/emailTemplate.js";
import { sendEmail } from "../utils/emailService.js";

const JOB_STATUS = ["inprogress", "artwork submitted", "publish artwork"];
const DECISION_STATUS = ["approved", "under review", "review rejected", "artwork approved", "hold", "ho approved",];
export const createJob = async (req, res) => {
  try {
    const { title, typeOfArtwork, priority, offerType, zone, state, language, items, offerDetails, otherDetails, attachment, dueDate } = req.body;
    console.log(dueDate)

    const newJob = new Job({
      title,
      priority,
      typeOfArtwork,
      offerType,
      zone,
      state,
      language,
      items,
      offerDetails,
      otherDetails,
      attachment,
      dueDate,
      createdBy: req.user.userId,
      decisionHistory: [{ status: "Created", updatedBy: req.user.userId }] // Auto-add initial status
    });

    await newJob.save();

    const html = generateJobCreateEmailHTML({
      job: newJob,
      created: req.user.name,
      adminPanelLink: `https://www.adbee.in/view-brandtreasury/${newJob._id}`

    });

    // Send Email to all (admin, marketing_manager, zonal_marketing_manager) excluding createdByUser
    const otherUsers = await User.find({
      role: { $in: ['admin', 'marketing_manager'] },
      _id: { $ne: req.user.userId },
    }).select('email');

    const createdByUser = await User.findById(newJob.createdBy).select('email');
    const assignedToUser = await User.findById(newJob.assignedTo).select('email');

    // Combine emails into a Set, filter undefined/null/empty later
    const emailSet = new Set([
      ...otherUsers.map(u => u.email).filter(Boolean),
      createdByUser?.email,
      assignedToUser?.email,
    ]);

    // Convert to Array and remove falsy values
    const emails = Array.from(emailSet).filter(Boolean);
    await sendEmail({ to: emails, subject: `New Job Created: ${newJob.title}`, html });


    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getAllJobs = async (req, res) => {
  try {
    let { page = 1, limit = 2, search, priority, languages } = req.query;


    let filter = {};
    if (req?.user?.role === "agency") {
      filter.assignedTo = req.user.userId;

    }
    if (req?.user?.role === "zonal_marketing_manager") {
      filter.createdBy = req.user.userId;

    }
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
      .populate('items.product', 'name')
      .populate('items.model', 'name')
      .populate('items.brand', 'name')

      .populate('decisionHistory.updatedBy', 'firstName lastName email profilePic')
      .populate('statusHistory.updatedBy', 'firstName lastName email profilePic')
      .populate('createdBy', 'firstName lastName email profilePic role')
      .populate('assignedTo', 'firstName lastName email profilePic');

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Reusable helper to generate safe signed URL
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

    // createdBy with profilePic
    let createdBy = null;
    if (job.createdBy) {
      createdBy = {
        _id: job.createdBy._id,
        email: job.createdBy.email,
        firstName: job.createdBy.firstName,
        lastName: job.createdBy.lastName,
        role: job.createdBy.role,
        profilePic: await getSignedUrlSafe(job.createdBy.profilePic)
      };
    }

    // assignedTo with profilePic
    let assignedTo = null;
    if (job.assignedTo) {
      assignedTo = {
        _id: job.assignedTo._id,
        email: job.assignedTo.email,
        firstName: job.assignedTo.firstName,
        lastName: job.assignedTo.lastName,
        profilePic: await getSignedUrlSafe(job.assignedTo.profilePic)
      };
    }

    // approvedBy from decisionHistory
    let approvedBy = null;
    const approvedStatus = job.decisionHistory.find(entry => entry.status === "Approved");
    if (approvedStatus?.updatedBy) {
      approvedBy = {
        _id: approvedStatus.updatedBy._id,
        email: approvedStatus.updatedBy.email,
        firstName: approvedStatus.updatedBy.firstName,
        lastName: approvedStatus.updatedBy.lastName,
        profilePic: await getSignedUrlSafe(approvedStatus.updatedBy.profilePic)
      };
    }

    // Main attachment
    const attachmentSignedUrl = await getSignedUrlSafe(job.attachment);

    // statusHistory with signed attachments and profilePics
    const statusHistoryWithSignedUrls = await Promise.all(
      job.statusHistory.map(async (entry) => ({
        ...entry.toObject(),
        updatedBy: {
          ...entry.updatedBy.toObject(),
          profilePic: await getSignedUrlSafe(entry.updatedBy?.profilePic)
        },
        attachmentSignedUrl: await getSignedUrlSafe(entry.attachment)
      }))
    );

    // decisionHistory with signed attachments and profilePics
    const decisionHistoryWithSignedUrls = await Promise.all(
      job.decisionHistory.map(async (entry) => ({
        ...entry.toObject(),
        updatedBy: {
          ...entry.updatedBy.toObject(),
          profilePic: await getSignedUrlSafe(entry.updatedBy?.profilePic)
        },
        attachmentSignedUrl: await getSignedUrlSafe(entry.attachment)
      }))
    );

    res.status(200).json({
      ...job.toObject(),
      createdBy,
      approvedBy,
      assignedTo,
      attachmentSignedUrl,
      statusHistory: statusHistoryWithSignedUrls,
      decisionHistory: decisionHistoryWithSignedUrls
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

export const approveJob = async (req, res) => {

  try {

    const { jobId } = req.params;
    const adminId = req.user._id; // Assuming user is authenticated


    const job = await Job.findById(jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });

    // Add approval entry in status history
    job.decisionHistory.push({
      status: "Approved",
      updatedBy: adminId,
      date: new Date(),
    });
    job.finalStatus = "Approved";


    await job.save();

    const html = firstJobApprovedEmailHTML({
      job,
      created: req.user.name,
      adminPanelLink: `https://www.adbee.in/view-brandtreasury/${jobId}`

    });

    const otherUsers = await User.find({
      role: { $in: ['admin', 'marketing_manager'] },
      _id: { $ne: req.user.userId },
    }).select('email');

    const createdByUser = await User.findById(job.createdBy).select('email');
    const assignedToUser = await User.findById(job.assignedTo).select('email');

    // Combine emails into a Set, filter undefined/null/empty later
    const emailSet = new Set([
      ...otherUsers.map(u => u.email).filter(Boolean),
      createdByUser?.email,
      assignedToUser?.email,
    ]);

    // Convert to Array and remove falsy values
    const emails = Array.from(emailSet).filter(Boolean);
    await sendEmail({ to: emails, subject: `New Job Created: ${newJob.title}`, html });

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

    const html = statusChangedJobEmailHTML({
      job,
      statusChangedBy: req.user.name,
      adminPanelLink: `https://www.adbee.in/artwork/${jobId}`

    });

    const otherUsers = await User.find({
      role: { $in: ['admin', 'marketing_manager'] },
      _id: { $ne: req.user.userId },
    }).select('email');

    const createdByUser = await User.findById(job.createdBy).select('email');
    const assignedToUser = await User.findById(job.assignedTo).select('email');

    // Combine emails into a Set, filter undefined/null/empty later
    const emailSet = new Set([
      ...otherUsers.map(u => u.email).filter(Boolean),
      createdByUser?.email,
      assignedToUser?.email,
    ]);

    // Convert to Array and remove falsy values
    const emails = Array.from(emailSet).filter(Boolean);


    await sendEmail({ to: emails, subject: `Job Status updated of : ${job.title}`, html });



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

    const job = await Job.findById(jobId).populate('assignedTo');

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Update the assignedTo field
    job.assignedTo = assignedTo;

    const alreadyAssigned = job.decisionHistory.some(
      entry => entry.status === 'Assigned'
    );
    if (!alreadyAssigned) {

      // Push a new entry into the decisionHistory array
      job.decisionHistory.push({
        status: 'Assigned',
        comment: comment || '', // Use the provided comment or an empty string if no comment is provided
        updatedBy: adminId,
        date: new Date(), // Set the current date and time
      });
      job.finalStatus = 'Assigned';

      const assignedUser = await User.findById(assignedTo).select('firstName lastName');


      const html = assignedJobEmailHTML({
        job,
        assigned: { by: req.user.name, to: assignedUser },
        adminPanelLink: `https://www.adbee.in/artwork/${jobId}`

      });

      const otherUsers = await User.find({
      role: { $in: ['admin', 'marketing_manager'] },
      _id: { $ne: req.user.userId },
    }).select('email');

    const createdByUser = await User.findById(job.createdBy).select('email');
    const assignedToUser = await User.findById(job.assignedTo).select('email');

    // Combine emails into a Set, filter undefined/null/empty later
    const emailSet = new Set([
      ...otherUsers.map(u => u.email).filter(Boolean),
      createdByUser?.email,
      assignedToUser?.email,
    ]);

    // Convert to Array and remove falsy values
    const emails = Array.from(emailSet).filter(Boolean);


      await sendEmail({ to: emails, subject: `New Job Created: ${job.title}`, html });

      // Save the updated job document
      await job.save();
    }

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