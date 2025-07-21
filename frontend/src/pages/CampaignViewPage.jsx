import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Avatar from "../components/common/Avatar";
import PageTitle from "../components/common/PageTitle";
import StatusBubbleText from "../components/common/StatusBubbleText";
import FileIcon from "../components/common/FileIcon";
import { FiPaperclip, FiClock } from "react-icons/fi";
import { formatDateTime, formatShortDateTime, formatDateDistance } from "../utils/formatDateTime";
import StatusBubble from "../components/common/StatusBubble";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import Button from "../components/common/Button";
import CampaignStatusUpdater from "../components/common/CampaignStatusUpdater";
import AssignToDropdown from "../components/common/AssignToDropdown";
import { useAuth } from "../context/auth-context";

const getStatusColor = (status) => {
    const statusMap = {
        "campaign-created": "info",
        "offers-approved": "success",
        "assigned-content": "info",
        "content-submitted": "warning",
        "content-approved": "success",
        "assigned-publishing": "info",
        "published": "success",
    };

    return statusMap[status?.toLowerCase()] || "default";
};

const statusIcons = {
    "campaign-created": "clock",
    "offers-approved": "check",
    "assigned-content": "user",
    "content-submitted": "clock",
    "content-approved": "check",
    "assigned-publishing": "user",
    "published": "rocket",
};
const CampaignViewPage = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mergedHistory, setMergedHistory] = useState([]);
    const [assigUser, setAssigUser] = useState(null)
    const [success, setSuccess] = useState('')
    const [statusUpdated, setStatusUpdated] = useState('')
    const getAssignmentRole = (status) => {
        if (status === "offers-approved") return "design";
        if (status === "content-approved") return "publish";
        return null;
    };
    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/campaigns/${id}`, {
                    withCredentials: true,
                });

                const data = response.data;
                setCampaign(data);
                console.log(data)

                const combinedHistory = [...(data.decisionHistory || []), ...(data.statusHistory || [])].sort(
                    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                );
                setMergedHistory(combinedHistory);

                console.log(data);
            } catch (err) {
                setError("Failed to fetch campaign details");
            } finally {
                setLoading(false);
            }
        };
        fetchCampaign();
    }, [id, statusUpdated]);
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
    const handleDelete = async (campaignId) => {
        if (!window.confirm("Are you sure you want to delete this Campaign?")) return;

        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/campaigns/${campaignId}`, { withCredentials: true });


            navigate("/campaigns", { state: { successMessage: "Campaign deleted successfully!" } }); // Redirect after deletion
        } catch (error) {
            console.error("Error deleting Campaign:", error.response?.data);
            setError("Error deleting Campaign: " + (error.response?.data?.message || error.message));
        }
    };

    const getMimeTypeFromUrl = (url) => {
        if (!url) return "application/octet-stream";
        const ext = url.split("?")[0].split(".").pop().toLowerCase();
        const mimeTypes = {
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            pdf: "application/pdf",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        };
        return mimeTypes[ext] || "application/octet-stream";
    };

    const assignUserToCampaign = async (campaignId, role) => {
        setLoading(true);
        console.log(campaignId)
        if (!assigUser) {
            setError("Please select a user to assign.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/campaigns/${campaignId}/assign`,
                {
                    assignedTo: assigUser,
                    role, // pass the role string: 'design' or 'publish'
                    comment: "Assigned from frotend UI" // optional
                },
                { withCredentials: true }
            );

            setSuccess(response.data.message);
            setStatusUpdated((prev) => !prev);
        } catch (error) {
            console.error("Error assigning user:", error.response?.data || error.message);
            setError("Failed to assign user: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10">Loading...</div>;
    if (error) return <div className="p-10 text-red-500">{error}</div>;

    return (
        <div className="p-5 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 gap-4">
                <PageTitle>Lead Gen Campaign</PageTitle>
                <StatusMessageWrapper
                    loading={loading}
                    error={error}
                />
                <Button width="auto" type="button" onClick={() => navigate('/campaigns')} >Back</Button>
            </div>
            <div className="flex   justify-start ">
                <div className="hidden sm:flex  flex-wrap-reverse  flex-row-reverse gap-2 flex-wrap justify-end mb-5">
                    {mergedHistory.length > 0 ? (
                        mergedHistory.map((history) => (
                            <div key={history._id} className={`flex gap-2 items-center border  px-3 py-1  text-xs capitalize rounded-md mr-0 relative  ${history?.status.toLowerCase() === "content-approved" ? 'bg-red-500 border-red-500 text-white' : history?.status.toLowerCase() === "published" ? 'bg-orange-50 border-orange-200 text-orange-900' : 'border-gray-300 bg-white'}`}>
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
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{campaign.title}</h2>
                            <p className="text-sm text-gray-500">Due: {formatDateTime(campaign.dueDate)}</p>
                        </div>
                        <StatusBubbleText text={campaign.finalStatus} status={getStatusColor(campaign.finalStatus)} />
                    </div>

                    <div className="flex gap-4 items-center">
                        <Avatar name={campaign?.createdBy?.name} size="sm" />
                        <div>
                            <p className="text-base font-semibold">{campaign?.createdBy?.name}</p>
                            <p className="text-sm text-gray-500">{campaign?.createdBy?.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* <div>
                            <label className="text-gray-400">Type</label>
                            <p className="font-semibold capitalize">{campaign.typeOfCampaign}</p>
                        </div> */}
                        <div>
                            <label className="text-gray-400">Zone</label>
                            <p className="font-semibold capitalize">{campaign.zone}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-gray-400">Offer Details</label>
                            <p className="font-semibold capitalize">{campaign.campaignDetails || "—"}</p>
                        </div>
                    </div>

                    {campaign.attachment && (
                        <div className="flex items-center gap-2">
                            <FileIcon mimeType={getMimeTypeFromUrl(campaign.attachment)} size={20} />
                            <a
                                href={campaign.attachment}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                Download Attachment
                            </a>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row  gap-5">
                        {['admin', 'marketing_manager'].includes(user?.role) && (
                            <Button type="button" onClick={() => handleDelete(campaign?._id)}>
                                Delete Campaign
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={() => navigate('/campaigns')}>Back</Button>
                    </div>
                </div>

                <div className=' bg-white border border-blue-300/60 rounded-lg  w-full shadow-md overflow-hidden '>
                    <div className='flex  gap-5 justify-between p-0 h-full '>
                        <div className=" sm:w-[70%] p-6">


                            <CampaignStatusUpdater campaignId={campaign?._id} currentStatus={campaign?.finalStatus} onUpdate={handleStatusUpdate} assignedTo={campaign?.designAssignedTo?._id === user?._id} contentAssignedTo={campaign?.contentAssignedTo?._id === user?._id} />
                            <div>
                                {typeof campaign?.designAssignedTo === "object" && campaign?.designAssignedTo && (
                                    <div className="assigne-to-seaction mb-5">
                                        <h3 className="text-lg font-semibold text-gray-700">Assigned to</h3>
                                        <div className="flex gap-3 items-center">
                                            <Avatar name={campaign?.designAssignedTo?.firstName} src={campaign?.designAssignedTo?.profilePic} size="sm" />
                                            <div>
                                                <p className="text-gray-400 text-base/tight">
                                                    Content
                                                </p>
                                                <span className="text-gray-700 font-bold">
                                                    {campaign?.designAssignedTo?.firstName || "N/A"} {campaign?.designAssignedTo?.lastName || ""}
                                                </span>

                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mb-4 pb-5">
                                {typeof campaign?.publishAssignedTo === "object" && campaign?.publishAssignedTo && (
                                    <div className="assigne-to-seaction ">
                                        <div className="flex gap-3 items-center">
                                            <Avatar name={campaign?.publishAssignedTo?.firstName} src={campaign?.publishAssignedTo?.profilePic} size="sm" />
                                            <div>
                                                <p className="text-gray-400 text-base/tight">
                                                    Publish
                                                </p>
                                                <p className="text-gray-400 text-base/tight">
                                                    <span className="text-gray-700 font-bold">
                                                        {campaign?.publishAssignedTo?.firstName || "N/A"} {campaign?.publishAssignedTo?.lastName || ""}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                {(
                                    (campaign?.finalStatus === 'offers-approved' || campaign?.finalStatus === 'content-approved') &&
                                    ['admin', 'marketing_manager'].includes(user?.role)
                                ) && (
                                        <>
                                            <h2 className=" pb-2 border-b border-gray-300 text-xl font-bold">Assign to</h2>
                                            <div className="flex flex-col gap-3">
                                                <AssignToDropdown onSelect={(userId) => setAssigUser(userId)} />
                                                <Button
                                                    type="button"
                                                    onClick={() => assignUserToCampaign(campaign._id, getAssignmentRole(campaign?.finalStatus))}
                                                    disabled={loading || !assigUser}
                                                >
                                                    {loading ? "Assigning..." : "Assign"}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                            </div>

                        </div>
                        <div className=" bg-gray-50 w-full h-full ">
                            <h2 className="px-4 py-2 border-b border-gray-300 text-xl font-bold">History</h2>
                            <div className="">
                                {[...(campaign.statusHistory || []), ...(campaign.decisionHistory || [])]
                                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                    .map((entry) => {
                                        const normalizedKey = entry?.status?.toLowerCase().replace(/\s+/g, "").replace("for", "").trim();

                                        return (
                                            <div
                                                key={entry._id}
                                                className="border-b px-8 py-4 border-gray-300 flex flex-col gap-2"
                                            >
                                                <div className="flex justify-between items-center text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <FiClock />
                                                        {formatShortDateTime(entry.timestamp)}
                                                    </div>

                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-xs text-gray-400 font-semibold opacity-60">
                                                            {formatDateDistance(entry.timestamp).relative}
                                                        </span>

                                                        <p className="flex gap-2 items-center capitalize text-xs font-semibold">
                                                            {entry.status.replace(/artwork/gi, "").trim()}
                                                            <StatusBubble
                                                                size="md"
                                                                icon={statusIcons[normalizedKey] || "clock"}
                                                                status={getStatusColor(normalizedKey) || "default"}
                                                                className="test"
                                                            />
                                                            {/* Optionally show raw status for debugging */}
                                                            {/* {normalizedKey} */}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    <div className="flex gap-3 min-w-8">
                                                        <Avatar
                                                            name={entry?.updatedBy?.firstName}
                                                            src={entry?.updatedBy?.profilePic}
                                                            size="sm"
                                                        />

                                                        <div>
                                                            <p className="text-gray-800 text-sm font-medium">
                                                                {entry?.updatedBy?.firstName || "N/A"}{" "}
                                                                {entry?.updatedBy?.lastName || "N/A"}
                                                            </p>
                                                            <p className="text-gray-600 text-sm w-full">{entry.comment}</p>
                                                            {entry.attachment && (
                                                                <a
                                                                    href={entry.attachment}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-blue-600 flex items-center gap-1 mt-2 hover:underline"
                                                                >
                                                                    <FiPaperclip /> Attachment
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>


                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CampaignViewPage;
