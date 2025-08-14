import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from '../../context/auth-context';
import { FiUploadCloud } from "react-icons/fi";
import Button from "./Button";
import ProgressBar from "./ProgressBar";
import StatusMessageWrapper from "./StatusMessageWrapper";

const CampaignStatusUpdater = ({ campaignId, currentStatus, assignedTo, onUpdate }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");

  const normalizedStatus = currentStatus?.toLowerCase();
  const role = user?.role?.toLowerCase();

  const statuses = (() => {

    if (normalizedStatus === "campaign-created") {
      if (role === "brand_manager") {
        return ["offers-inreview", "offers-approved", "offers-rejected"];
      }
      
    }

    if (
      normalizedStatus === "offers-inreview" ||
      normalizedStatus === "offers-rejected" || normalizedStatus === "campaign-created"
    ) {
      if (role === "zonal_marketing_manager") {
        return ["campaign-resubmitted"];
      }
    }

    if (normalizedStatus === "campaign-resubmitted") {
      if (role === "brand_manager") {
        return ["offers-inreview", "offers-approved", "offers-rejected"];
      }
    }

    if (normalizedStatus === "offers-inreview") {
      if (role === "brand_manager") {
        return ["offers-approved", "offers-rejected"];
      }
    }

    if (normalizedStatus === "offers-rejected") {
      if (role === "brand_manager") {
        return [];
      } else if (role === "zonal_marketing_manager") {
        return ["campaign-resubmitted"];
      }
    }

    //   if (normalizedStatus === "offers-approved") {
    //   if (["admin", "marketing_manager"].includes(role)) {
    //     return ["assigned-content-creat"];
    //   }
    // }

    if (normalizedStatus === "assigned-content") {


      if (role === "agency" && assignedTo) {
        return ["content-submitted"];
      }
    }

    if (normalizedStatus === "content-submitted" || normalizedStatus === "content-resubmitted") {
      if (["brand_manager, "].includes(role)) {
        return ["content-approved", "content-rejected", "content-inreview"];
      }
       if (["marketing_manager "].includes(role)) {
        return ["content-approved", "content-rejected", "content-inreview"];
      }
      if (["agency"].includes(role)) {
        return ["content-resubmitted"];
      }
    }
    if (normalizedStatus === "content-inreview") {
      if ([ "brand_manager"].includes(role)) {
        return ["content-approved", "content-rejected"];
      }
       if (["agency"].includes(role)) {
        return ["content-resubmitted"];
      }
    }
    if (normalizedStatus === "content-rejected") {
      if (["brand_manager"].includes(role)) {
        return ["content-approved", "content-inreview"];
      }
       if (["agency"].includes(role)) {
        return ["content-resubmitted"];
      }
    }
    // if (normalizedStatus === "content-approved") {
    //   if (["admin", "marketing_manager"].includes(role)) {
    //     return ["assigned-publishing"];
    //   }
    // }

    if (normalizedStatus === "assigned-publishing") {
      if (["agency"].includes(role)) {
        return ["published"];
      }
    }





    return [];
  })();

  useEffect(() => {
    // console.log(normalizedStatus)
    if (normalizedStatus === "created" || normalizedStatus === "pending") {
      if (["marketing_manager", "admin"].includes(role)) {
        setMessage("You may approve or reject the campaign.");
      } else {
        setMessage("Campaign is created and pending approval.");
      }
    } else if (normalizedStatus === "approved") {
      if (["marketing_manager", "admin"].includes(role)) {
        setMessage("Campaign approved. You may now assign it.");
      } else {
        setMessage("Campaign is approved and awaiting assignment.");
      }
    } else if (normalizedStatus === "design-assignedto") {
      if (["marketing_manager", "agency", "designer"].includes(role)) {
        setMessage("Campaign assigned to you. You may now submit your work.");
      } else {
        setMessage("Campaign has been assigned.");
      }
    } else if (normalizedStatus === "submitted") {
      if (["marketing_manager", "admin", "designer"].includes(role)) {
        setMessage("Campaign submitted. Review or approve to proceed.");
      } else {
        setMessage("Submission received. Awaiting review.");
      }
    } else if (normalizedStatus === "rejected") {
      setMessage("Campaign was rejected. Please review comments.");
    } else if (normalizedStatus === "designapproved") {
      setMessage("Campaign design was Approved. Please review comments.");
    }
    else {
      setMessage("No available actions for your role at the current status.");
    }
  }, [normalizedStatus, role, assignedTo]);

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const updateStatus = async () => {
    if (!status) {
      if (onUpdate) onUpdate({ error: "Please select a status from the dropdown" });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let fileUrl = "";

      if (attachment) {
        const timestamp = Date.now();
        const folderName = "campaign";
        const fileNameWithFolder = `${folderName}/${timestamp}-${attachment.name}`;

        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`,
          { fileName: fileNameWithFolder, fileType: attachment.type }
        );

        if (!data.signedUrl) throw new Error("Failed to get signed URL");

        await axios.put(data.signedUrl, attachment, {
          headers: { "Content-Type": attachment.type },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        });

        fileUrl = data.fileUrl;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/campaigns/${campaignId}/update-status`,
        { status, comment, attachment: fileUrl },
        { withCredentials: true }
      );

      setComment("");
      setAttachment(null);
      setUploadProgress(0);

      if (onUpdate) {
        onUpdate({ status, comment, attachment: fileUrl, updatedAt: new Date() });
      }
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      if (onUpdate) onUpdate({ error: error.response?.data?.message || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {statuses.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4 mb-1">Campaign Status Update</h3>
          {attachment && <p>Selected file: {attachment.name}</p>}

          <textarea
            className="border border-gray-400 focus:outline-blue-300 rounded-lg"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px", resize: "vertical" }}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-400 rounded-lg p-2 mb-2 capitalize"
          >
            <option value="">Select Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => document.getElementById("fileInput").click()}
            className="bg-amber-50 py-2 border border-amber-100 text-red-500 w-full rounded-md flex justify-center items-center gap-2 cursor-pointer"
          >
            <FiUploadCloud size={18} /> Select a file to upload
          </button>

          {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}

          <div className="flex gap-4">
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
            <Button
              type="button"
              onClick={updateStatus}
              disabled={
                loading ||
                !status ||
                (
                  !attachment &&
                  status !== "published" &&
                  status !== "offers-inreview" &&
                  status !== "offers-rejected" &&
                  status !== "offers-approved" &&
                  status !== "content-approved" &&
                  status !== "content-rejected" &&
                  status !== "content-inreview"
                )
              }
            >              {loading ? "Updating..." : "Submit"}
            </Button>
          </div>
        </>
      )}
      <div className="my-4">
        <StatusMessageWrapper success={message} />
      </div>
    </div>
  );
};

export default CampaignStatusUpdater;
