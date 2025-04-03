import { bucket } from "../config/storage.js";
import Job from "../models/JobModel.js";


export const createJob = async (req, res) => {
  try {
    const { title, type, priority, offerType, zone, state, language, product, brand, model, offerDetails, otherDetails, attachment,dueDate } = req.body;
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
    const jobs = await Job.find()
      .populate('decisionHistory.updatedBy', 'firstName lastName email profilePic')
      .populate({ path: 'createdBy', select: 'firstName lastName profilePic role' })
      .populate('statusHistory.updatedBy', 'firstName lastName email profilePic')
      .populate('assignedTo', 'firstName email profilePic');

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

    res.status(200).json(jobsWithSignedUrls);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};