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