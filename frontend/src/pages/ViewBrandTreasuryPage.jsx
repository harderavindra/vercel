import React, { useState, useEffect } from "react";
import { data, useParams } from "react-router-dom";
import axios from "axios";
import { getFileIcon } from "../utils/constants";
import { formatDateTime } from "../utils/formatDateTime";
import { FiCamera, FiChevronRight, FiTrash2, FiUploadCloud } from "react-icons/fi";
import { convertSizeToMB } from "../utils/fileSizeConverter";
import Button from "../components/common/Button";
import FileViewer from "../components/common/FileViewer";
import FileIcon from "../components/common/FileIcon";
import DeleteBrandComponent from "../components/brand/DeleteBrandComponent";
import Avatar from "../components/common/Avatar";
import { snakeToCapitalCase } from "../utils/convertCase";
import ThumbnailUploader from "../components/brand/ThumbnailUploader";
import StatusBubble from "../components/common/StatusBubble";
import { updateStar } from "../api/brandTreasury";
const ViewText = ({ children }) => (<p className='text-xl capitalize'>{children}</p>)
const InfoRow = ({ label, children }) => (
    <div className="flex gap-4 items-center bg-gray-50 px-4 py-2 w-full">
        <label className="text-gray-400 w-[30%] min-w-fit">{label}</label>
        <p className='text-lg capitalize'>{children}</p>
    </div>
);
const ViewBrandTreasuryPage = () => {

    const { fileId } = useParams();
    const [document, setDocument] = useState(null);
    const [thumbnails, setThumbnails] = useState([]);
    const [message, setMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isApproved, setIsApproved] = useState(false);
    const [isStarred, setIsStarred] = useState(document?.isStarred || false);

    const fetchFile = async () => {
        try {

            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/get-brandtreasury/${fileId}`, { withCredentials: true });
            setDocument(data);
            setThumbnails(data?.thumbnailUrls || []);
            setIsApproved(data.approved)
            setIsStarred(data?.isStarred)
            console.log(data, 'thumbnailsxxxxxxxxx')
        } catch (error) {
            console.error("Error fetching file:", error);
            setMessage("Failed to fetch file details.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {

        fetchFile();
    }, [fileId, isStarred]);



    const handleApproval = async () => {
        const newStatus = !isApproved;

        try {
            const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/${document._id}/approval`;
            console.log("API Request URL:", url);

            const response = await axios.post(
                url,
                { approved: newStatus }, // Add comment if required
                { withCredentials: true }
            );

            if (response.data.success) { // Correct way to check Axios response
                setIsApproved(newStatus);
                fetchFile();

            } else {
                alert("Failed to update approval status.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert(error.response?.data?.message || "An error occurred.");
        }
    };
    const handleStarToggle = async () => {
        try {
            setIsStarred(!isStarred); // Optimistically update UI
            const response = await updateStar(document._id); // Call API
            setIsStarred(response.isStarred); // Update state based on API response
        } catch (error) {
            console.error('Failed to update starred status:', error);
            setIsStarred(isStarred); // Revert if API call fails
        }
    };
    return (
        <div className="w-full p-10" >
            <div className="flex gap-10 overflow-hidden">
                <div className="flex flex-col gap-4  bg-white border border-blue-300/60 rounded-xl p-6  shadow-md relative w-full max-w-lg ">
                    <div className="flex justify-between">
                        <StatusBubble size='sm' status={document?.isStarred ? 'warning' : 'disabled'} icon={'star'} className='cursor-pointer' onClick={handleStarToggle} />

                        <StatusBubble size='sm' status={document?.approved ? 'success' : 'disabled'} icon={'check'} className='' />

                    </div>
                    <div className="flex flex-col gap-0">
                        <label className='text-gray-400 mb-1'>Title</label>
                        <ViewText>{document?.title}</ViewText>
                    </div>
                    <ThumbnailUploader fileId={fileId} thumbnails={thumbnails} setThumbnails={setThumbnails} />

                    <div className="flex justify-between">
                        <p className="flex items-center gap-2">
                            <FileIcon mimeType={document?.mimeType} size={18} className="" />
                            {document?.mimeType}</p>
                        <p className="flex items-center gap-4"><FiCamera /> {convertSizeToMB(document?.size)}</p>
                    </div>
                    <div className="flex gap-4">
                        <a href={document?.fileUrl}
                            download={document?.fileName} target="_blank" >Download</a>
                        <Button onClick={() => FileViewer(document?.fileUrl)} variant="outline">View</Button>
                    </div>
                </div>
                <div className="flex flex-col gap-4  bg-white border border-blue-300/60 rounded-xl  shadow-md relative  px-20 py-10 w-full">
                    <h1 className="text-xl font-bold">Product Category</h1>
                    <div className="flex flex-col gap-2 justify-between">
                        <InfoRow label="Document Type">{document?.documentType}</InfoRow>
                        <InfoRow label="Content Type">
                            {snakeToCapitalCase(document?.contentType || "N/A")}
                        </InfoRow>

                    </div>
                    <h1 className="text-base font-semibold">Product Info </h1>
                    <div className="flex ">
                        <InfoRow label="Product">{document?.product}</InfoRow>
                        <InfoRow label="Brand">{document?.brand}</InfoRow>
                        <InfoRow label="Model">{document?.model}</InfoRow>
                    </div>
                    <div className="flex flex-col ">
                    <h1 className="text-xl font-bold">Comment</h1>

                    <div dangerouslySetInnerHTML={{ __html: document?.comment }} />

                    </div>
                    <h1 className="text-base font-semibold">History & ownership </h1>
                    <div className="flex  gap-2 justify-between bg-gray-50 px-6 py-2 text-lg">
                        <div className="flex flex-col gap-2 justify-between">

                            <label className='text-gray-400 mb-1'>Created : {formatDateTime(document?.createdAt)}</label>
                            <div className="flex items-center gap-2">
                                <Avatar src={document?.createdBy?.profilePic} size="md" />
                                <div className="flex flex-col -gap-0">
                                    <label className="text-base/2">{document?.createdBy?.firstName} {document?.createdBy?.lastName}</label>
                                    <label className="capitalize text-gray-500">{document?.createdBy?.role}</label>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 justify-between">

                            {isApproved ? (
                                <div className="flex flex-col gap-2 justify-between">

                                    <label className='text-gray-400 mb-1'>Approved : {formatDateTime(document?.approvedAt)}</label>
                                    <div className="flex items-center gap-2">
                                        <Avatar src={document?.approvedBy?.profilePic} size="md" />
                                        <div className="flex flex-col -gap-0">
                                            <label className="text-base/2">{document?.approvedBy?.firstName} {document?.approvedBy?.lastName}</label>
                                            <label className="capitalize text-gray-500">{document?.approvedBy?.role}</label>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p>Not Approved </p>
                            )}
                        </div>

                    </div>
                    <div className="flex gap-10 mt-6">
                        <div className="w-full">
                            <Button onClick={handleApproval} color={document?.approved ? "red" : "green"}>
                                {document?.approved ? "Remove Approval" : "Approve"}
                            </Button>
                        </div>
                        <div className="w-full">

                            <DeleteBrandComponent id={document?._id} storagePath={document?.storagePath} thumbnailUrl={document?.thumbnailUrl} />
                        </div>

                    </div>
                </div>


            </div>



            {message && <p style={{ color: message.includes("failed") ? "red" : "green", marginTop: "10px" }}>{message}</p>}
        </div>
    );
};

export default ViewBrandTreasuryPage;
