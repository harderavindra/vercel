import { useState } from "react";
import axios from "axios";
import { useAuth } from '../../context/auth-context';
import { FiUploadCloud } from "react-icons/fi";
import Button from "./Button";

const StatusUpdater = ({ jobId, currentStatus, assignedTo, onUpdate }) => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState();
    const [comment, setComment] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const statuses = (() => {
        if (currentStatus === "Pending") return ["Approved"];
        if (!assignedTo) return [];
        return ["Inprogress", "Hold", "Completed"]
            .filter((s) => !(s === "Approved" && currentStatus === "Approved"))
            .filter((s) => !(s === "Completed" && user?.role !== "admin"));
    })();

    const handleFileChange = (e) => {
        setAttachment(e.target.files[0]);
    };

    const updateStatus = async () => {
        if (!status) {
            if (onUpdate) {
                onUpdate({ error: "Please select a status from the dropdown" });
            }
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            let fileUrl = " ";
      if (attachment) {
        const timestamp = Date.now();
        const folderName = "job";
        const fileNameWithFolder = `${folderName}/${timestamp}-${attachment.name}`;

        // Get signed URL from backend
        const { data } = await axios.post(
            `${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`,
            { fileName: fileNameWithFolder, fileType: attachment.type }
        );

        if (!data.signedUrl) throw new Error("Failed to get signed URL");

        // Upload file to Google Cloud using signed URL
        await axios.put(data.signedUrl, attachment, {
            headers: { "Content-Type": attachment.type },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted); // Update the progress state

                console.log("Upload Progress:", percentCompleted + "%");
            },
        });

        fileUrl = data.fileUrl; // Use the file URL from the response
    }

            const response = await axios.post(
               `${import.meta.env.VITE_BACKEND_BASE_URL}/api/jobs/${jobId}/update-status`,
                { status, comment, attachment: fileUrl },
                { withCredentials: true }
            );

            setComment("");
            setAttachment(null);
            setUploadProgress(0);

            if (onUpdate) {
                onUpdate({
                    status,
                    comment,
                    attachment: fileUrl,
                    updatedAt: new Date(),
                });
            }
        } catch (error) {
            console.error("Error updating status:", error.response?.data || error.message);
            if (onUpdate) {
                onUpdate({ error: error.response?.data?.message || error.message });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">

            {statuses.length > 0 && (
                <>
                <h3 className="text-lg font-semibold mt-4 mb-1">Task Status Update</h3>
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
                        className="border border-gray-400 rounded-lg p-2 mb-2"
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
                        onClick={() => document.getElementById("fileInput").click()}
                        className="bg-amber-50 py-2 border border-amber-100 text-red-500 w-full rounded-md flex justify-center items-center gap-2"
                    >
                        <FiUploadCloud size={18} /> Select a file to upload
                    </button>

                    {uploadProgress > 0 && (
                        <div className="flex items-center gap-2">
                            <progress value={uploadProgress} max="100"></progress>
                            <span>{uploadProgress}%</span>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button variant="outline" disabled={loading }>Cancel</Button>
                        <Button onClick={updateStatus} disabled={loading || !status}>
                            {loading ? "Updating..." : "Submit"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default StatusUpdater;
