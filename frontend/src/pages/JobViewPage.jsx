import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import axios from "axios"; // Import axios
import Avatar from "../components/common/Avatar";
import { formatDateTime, formatDateDistance, formatShortDateTime } from "../utils/formatDateTime";
import StatusBubbleText from "../components/common/StatusBubbleText";
import Button from "../components/common/Button";
import StatusBubble from "../components/common/StatusBubble";
import { FiClipboard, FiClock, FiPaperclip } from "react-icons/fi";
import StatusUpdater from "../components/common/StatusUpdater";
import AssignToDropdown from "../components/common/AssignToDropdown";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import PageTitle from "../components/common/PageTitle";
import FileIcon from "../components/common/FileIcon";
import { useAuth } from "../context/auth-context";

const getPriorityColor = (priority) => {
    const priorityMap = {
        urgent: "error",
        high: "warning",
        medium: "info",
        low: "disabled",
    };
    return priorityMap[priority?.toLowerCase()] || "default";
};

const getStatusColor = (status) => {
    const statusMap = {
        created: "success",
        assigned: "info",
        approved: "success",
        hold: "warning",
        "under review": "error",
        "artwork rejected": "error",
        "artwork approved": "success",
        inprogress: "info",
        "artwork submitted": "info",
        "ho approved": "success",
          "review rejected": "error",
          "review rejected": "error",
          "publish artwork": "info",

    };
    return statusMap[status?.toLowerCase()] || "default";
};
const statusIcons = {
    created: "clock",
    assigned: "user",
    approved: "check",
    hold: "eye",
    "under review": "eye",
    "artwork rejected": "reject",
    "artwork approved": "done",
    inprogress: "clock",
    "artwork submitted": "pad",
    "ho approved": "shieldcheck",
    "review rejected": "reject",
    "publish artwork": "rocket",



};

const JobViewPage = () => {
    const { user } = useAuth();

    const { fileId } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const [mergedHistory, setMergedHistory] = useState([]);
    const [assigUser, setAssigUser] = useState(null)
    const isApproved = job?.decisionHistory?.some(item => item.status === "approved") ?? false;
    const [statusUpdated, setStatusUpdated] = useState(false);

    const LabelValue = ({ label, value }) => (
        <div className="w-full">
            <label className="text-gray-400">{label}</label>
            <p className="first-letter:uppercase font-semibold">{value}</p>
        </div>
    );

    const mimeTypes = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        pdf: "application/pdf",
        txt: "text/plain",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        zip: "application/zip",
        mp4: "video/mp4",
    };

    // Get MIME type from file extension
    const getMimeTypeFromUrl = (url) => {
        if (!url) return "application/octet-stream"; // Default unknown MIME type

        const ext = url.split("?")[0].split(".").pop().toLowerCase();
        return mimeTypes[ext] || "application/octet-stream"; // Fallback to unknown
    };

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/jobs/${fileId}`, { withCredentials: true });

                const data = response.data;
                console.log(data)
                setJob(data);
                const combinedHistory = [...data.decisionHistory, ...data.statusHistory].sort(
                    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                );
                setMergedHistory(combinedHistory);
            } catch (err) {
                console.error("Error fetching job:", err);
                setError(err.response?.data?.message || "Failed to fetch job details");
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [fileId, statusUpdated]);



    const handleDelete = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/jobs/${jobId}`, { withCredentials: true });


            setSuccess("Job deleted successfully!");
            navigate("/artworks", { state: { successMessage: "Job deleted successfully!" } }); // Redirect after deletion
        } catch (error) {
            console.error("Error deleting job:", error.response?.data);
            setError("Error deleting job: " + (error.response?.data?.message || error.message));
        }
    };
    const assignUserToJob = async (jobId) => {
        if (!assigUser) {
            setError("Please select a user to assign.");
            return;
        }

        try {

            // Make an API request to assign the user to the job
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/jobs/${jobId}/assign`,
                { assignedTo: assigUser },
                { withCredentials: true }
            );

            setSuccess(response.data.message);
            setStatusUpdated((prev) => !prev);
            // Optionally, trigger an onUpdate callback to update the UI
        } catch (error) {
            console.error("Error assigning user:", error.response?.data || error.message);
            setError("Failed to assign user: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = (data) => {
        if (data.error) {
            setError(`Error: ${data.error}`);
            setSuccess(""); // Clear success message
        } else {
            setSuccess(`Status updated successfully: ${data.status || ""}`);
            setError(""); // Clear error
        }
        setStatusUpdated((prev) => !prev); // Ensure state updates correctly
    };

    return (
        <div className=" p-4 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 gap-4">
                <PageTitle>Artwork Request</PageTitle>
                <StatusMessageWrapper
                    loading={loading}
                    error={error}
                />
                <Button width="auto" type="button" onClick={() => navigate('/artworks')} >Back</Button>
            </div>

            <div className="flex   justify-start ">
                <div className="hidden sm:flex  flex-wrap-reverse  flex-row-reverse gap-2 flex-wrap justify-end mb-5">
                    {mergedHistory.length > 0 ? (
                        mergedHistory.map((history) => (
                            <div key={history._id} className={`flex gap-2 items-center border  px-3 py-1  text-xs capitalize rounded-md mr-0 relative  ${history?.status.toLowerCase() === "ho approved" ? 'bg-red-500 border-red-500 text-white' : history?.status.toLowerCase() === "artwork approved" ? 'bg-orange-50 border-orange-200 text-orange-900' : 'border-gray-300 bg-white'}`}>
                                <Avatar name={history?.updatedBy?.firstName} src={history?.updatedBy?.profilePic} size="xs" />

                                {/* <StatusBubble
                                size="xxs"
                                icon={statusIcons[history?.status?.toLowerCase()] || "clock"}
                                status={getStatusColor(history?.status)?.toLowerCase().trim() || "error"}
                                className={'test'}
                            /> */}
                                {history?.status}
                                {history?.status.toLowerCase() !== "ho approved" && (
                                    <span
                                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-gray-300 z-10"
                                    />
                                )}

                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No history available</p>
                    )}
                    <div className="flex gap-2 items-center flex-wrap border border-red-500 bg-red-500 text-white font-bold px-3 py-1  text-xs capitalize rounded-md mr-0 relative ">
                        Timeline
                        <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-red-500 z-10" />
                    </div>
                </div>
            </div>
            <div className=' flex gap-10 flex-col sm:flex-row'>
                <div className='flex flex-col gap-4 bg-white border border-blue-300/60 rounded-lg p-6 px-10 sm:w-3xl shadow-md'>
                    <div className="pb-2 flex justify-between gap-3 items-start">
                        <h2 className="text-2xl font-bold text-gray-800">{job?.title}</h2>
                        {isApproved ? (
                            <StatusBubble size="xs" icon={'check'} status={"success"} />
                        ) : (
                            <StatusBubble size="xs" icon={'clock'} status={"error"} />
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-3">
                            <Avatar name={job?.createdBy?.firstName} src={job?.createdBy?.profilePic} size="sm" />
                            <div>
                                <p className="text-base/4 capitalize">{job?.createdBy?.firstName} {job?.createdBy?.lastName}</p>
                                <p className="text-sm">{formatDateTime(job?.createdAt)}</p>
                            </div>
                        </div>
                        <StatusBubbleText text={job?.priority || 'Low'} status={getPriorityColor(job?.priority)} className={'ml-auto'} />
                    </div>
                    <h2>Specification</h2>
                    <div className="bg-gray-100/70 p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <LabelValue label="Type Of Artwork" value={job?.typeOfArtwork} />
                            <LabelValue label="Offer Type" value={job?.offerType} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <LabelValue label="Zone" value={job?.zone} />
                            <LabelValue label="State" value={job?.state} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <LabelValue label="Language" value={job?.language?.join(", ")} />
                        </div>
                        <div>
                            <label className="text-gray-400">Products</label>
                        </div>
                        {job?.items?.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row  p-1 rounded-md mb-1 gap-2">
                                <span className="w-6 h-6 rounded-full bg-orange-300 items-center justify-center flex text-white text-xs">{index + 1}</span>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <p>{item?.product?.name || '—'} </p>
                                    <p>{item?.brand?.name || '—'} </p>
                                    <p>{item?.model?.name || '—'} </p>
                                </div>

                            </div>
                        ))}

                    </div>
                    {job?.attachmentSignedUrl && (
                        <div className="flex gap-2 items-center justify-start">
                            <FileIcon
                                mimeType={getMimeTypeFromUrl(job.attachmentSignedUrl)}
                                size={24}
                                className="text-blue-500"
                            />
                            <a
                                href={job.attachmentSignedUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block  text-blue-600 hover:underline"
                            >
                                Download Attachment
                            </a>
                        </div>
                    )}
                    <h2>Comment</h2>
                    <div className="bg-gray-100/70 p-4 rounded-lg">
                        {job?.offerDetails}
                    </div>
                    <div className="flex flex-col sm:flex-row  gap-5">
                        {['admin', 'marketing_manager'].includes(user?.role) && (
                            <Button type="button" onClick={() => handleDelete(job?._id)}>
                                Delete Job
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={() => navigate('/artworks')}>Back to Artworks</Button>
                    </div>
                </div>
                <div className=' bg-white border border-blue-300/60 rounded-lg  w-full shadow-md overflow-hidden '>
                    <div className='flex flex-col sm:flex-row justify-between p-0 h-full '>
                        <div className=" sm:w-[70%] p-6">
                            {job?.assignedTo ? (
                                <div className="assigne-to-seaction">
                                    <h3 className="text-lg font-semibold text-gray-700">Assigned to</h3>
                                    <div className="flex gap-3 items-center">
                                        <Avatar name={job?.assignedTo?.firstName} src={job?.assignedTo?.profilePic} size="sm" />

                                        <div>
                                            <p className="text-gray-400 text-base/tight">
                                                Assigned to{" "}
                                                <span className="text-gray-700 font-bold">
                                                    {job?.assignedTo?.firstName || "N/A"} {job?.assignedTo?.lastName || ""}
                                                </span>
                                            </p>
                                            <p className="text-gray-400 text-base/tight">
                                                Due Date{" "}
                                                <span className="text-gray-700 font-bold">
                                                    {job?.dueDate ? formatDateTime(job?.dueDate) : "No due date"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {isApproved && ['admin', 'marketing_manager'].includes(user?.role) ? (
                                        <div>
                                            <h2 className=" pb-2 border-b border-gray-300 text-xl font-bold">Assign to</h2>
                                            <div className="flex flex-col gap-3">
                                                <AssignToDropdown onSelect={(userId) => setAssigUser(userId)} />
                                                <Button type="button" onClick={() => assignUserToJob(job?._id)} disabled={loading || !assigUser}>
                                                    {loading ? "Assigning..." : "Assign"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        ""
                                        // <StatusMessageWrapper
                                        //     error={'An artwork approval is required to continue.'}

                                        // />
                                    )}

                                </>
                            )}
                            <StatusUpdater jobId={job?._id} assignedTo={job?.assignedTo} currentStatus={job?.finalStatus} onUpdate={handleStatusUpdate} />

                        </div>
                        <div className=" bg-gray-50 w-full h-full ">
                            <h2 className="px-4 py-2 border-b border-gray-300 text-xl font-bold">History</h2>
                            {mergedHistory.length > 0 ? (
                                mergedHistory.map((history) => (
                                    <div key={history._id} className="border-b px-8 py-4 border-gray-300 flex flex-col gap-2">
                                        <div className="flex items-center justify-between ">
                                            <p className="flex gap-2 items-center">
                                                <FiClock size={12} />
                                                {formatShortDateTime(history.timestamp)}
                                            </p>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xs text=gray-100 font-semibold opacity-40">
                                                    {formatDateDistance(history.timestamp).relative}
                                                </span>
                                                <p className="flex gap-2 items-center capitalize text-xs font-semibold ">
                                                    
                                                    {history.status.replace(/artwork/gi, "").trim()}
                                                    <StatusBubble
                                                        size="md"
                                                        icon={statusIcons[history?.status?.toLowerCase()] || "clock"}
                                                        status={getStatusColor(history?.status)?.toLowerCase().trim() || "error"}
                                                        className={'test'}
                                                    />

                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="min-w-8">
                                                <Avatar name={history?.updatedBy?.firstName} src={history?.updatedBy?.profilePic} size="sm" />
                                            </div>
                                            <div className="w-full">
                                                <p>by: {history?.updatedBy?.firstName} {history?.updatedBy?.lastName}</p>
                                                <p className=" text-gray-600 text-base/tight mb-2 ">{history.comment}</p>
                                                {history.attachmentSignedUrl  &&  (
                                                    <a
                                                        href={history.attachmentSignedUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-semibold text-gray-600 hover:underline flex items-center "
                                                    >
                                                        <FiPaperclip size={14} /> Attachment
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No history available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobViewPage;
