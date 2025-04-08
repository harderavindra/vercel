import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiCamera,
  FiCheck,
  FiCopy,
  FiMail,
  FiShare2,
} from "react-icons/fi";
import Button from "../components/common/Button";
import FileIcon from "../components/common/FileIcon";
import DeleteBrandComponent from "../components/brand/DeleteBrandComponent";
import Avatar from "../components/common/Avatar";
import { formatDateTime } from "../utils/formatDateTime";
import { convertSizeToMB } from "../utils/fileSizeConverter";
import ThumbnailUploader from "../components/brand/ThumbnailUploader";
import StatusBubble from "../components/common/StatusBubble";
import { updateStar } from "../api/brandTreasury";
import PageTitle from "../components/common/PageTitle";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import { snakeToCapitalCase } from "../utils/convertCase";

// Reusable view components
const ViewText = ({ children }) => <p className="text-xl capitalize">{children}</p>;

const InfoRow = ({ label, children }) => (
  <div className="flex gap-4 items-center bg-gray-50 px-4 py-2 w-full">
    <label className="text-gray-400 w-[30%] min-w-fit">{label}</label>
    <p className="text-lg capitalize">{children}</p>
  </div>
);

const ViewBrandTreasuryPage = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [message, setMessage] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const fileUrl = document?.attachment?.signedUrl || "";
  const fileName = fileUrl ? new URL(fileUrl).pathname.split("/").pop() : "";

  const fetchFile = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/get-brandtreasury/${fileId}`,
        { withCredentials: true }
      );
      setDocument(data);
      setThumbnails(data?.thumbnailUrls || []);
      setIsApproved(data?.approved);
      setIsStarred(data?.isStarred);
      console.log(data)
    } catch (error) {
      console.error("Error fetching file:", error);
      setMessage("Failed to fetch file details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {


    fetchFile();
  }, [fileId]);

  const generateAndCopy = async () => {
    if (!shortUrl) {
      try {
        const fullDownloadUrl = `${fileUrl}&response-content-disposition=attachment%3B%20filename%3D${encodeURIComponent(fileName)}`;
        const res = await axios.get(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullDownloadUrl)}`
        );
        setShortUrl(res.data);
        await navigator.clipboard.writeText(res.data);
      } catch (err) {
        console.error("Failed to shorten or copy:", err);
        return;
      }
    } else {
      await navigator.clipboard.writeText(shortUrl);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApproval = async () => {
    const newStatus = !isApproved;
    try {
      const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/${document._id}/approval`;
      const response = await axios.post(
        url,
        { approved: newStatus },
        { withCredentials: true }
      );

      if (response.data?.success) {
        setIsApproved(newStatus);
        setSuccess("Approval status updated successfully.");
        fetchFile();
        setError(null);
      } else {
        setError("Failed to update approval status.");
        setSuccess(null);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "An error occurred.");
      setSuccess(null);
    } finally {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStarToggle = async () => {
    try {
      setIsStarred(!isStarred);
      const response = await updateStar(document._id);
      setIsStarred(response.isStarred);
    } catch (error) {
      console.error("Failed to update starred status:", error);
      setIsStarred(isStarred); // Revert
    }
  };



  return (
    <div className="w-full p-10">
      <div className="flex justify-between items-center pb-4">
        <PageTitle>Brand Treasury</PageTitle>
        <StatusMessageWrapper loading={loading} success={success} error={error} />
        <Button width="auto" onClick={() => navigate("/brand-treasury")}>
          Back
        </Button>
      </div>

      <div className="flex gap-10 overflow-hidden">
        {/* LEFT CARD */}
        <div className="flex flex-col gap-4 bg-white border border-blue-300/60 rounded-xl p-6 shadow-md relative w-full max-w-lg">
          <div className="flex justify-between">
            <StatusBubble
              size="sm"
              status={isStarred ? "warning" : "disabled"}
              icon="star"
              className="cursor-pointer"
              onClick={handleStarToggle}
            />
            <StatusBubble
              size="sm"
              status={isApproved ? "success" : "disabled"}
              icon="check"
            />
          </div>

          <div className="flex flex-col gap-0">
            <label className="text-gray-400 mb-1">Title</label>
            <ViewText>{document?.title}</ViewText>
          </div>

          <ThumbnailUploader fileId={fileId} thumbnails={thumbnails} setThumbnails={setThumbnails} />

          <div className="flex justify-between">
            <p className="flex items-center gap-2">
              <FileIcon mimeType={document?.mime} size={18} />
              {document?.mime}
            </p>
            <p className="flex items-center gap-4">
              <FiCamera />
              {convertSizeToMB(document?.size)}
            </p>
          </div>

          {fileUrl && (
            <div className="w-full flex flex-col gap-2">

              <p className="text-sm text-gray-500 mb-1 break-all ">{fileName}</p>
              <div className="flex gap-6 items-center justify-between">
                <a
                  href={`${fileUrl}&response-content-disposition=attachment%3B%20filename%3D${encodeURIComponent(fileName)}`}
                  className=" border border-gray-300 py-2 text-center rounded-md w-full "
                  download={fileName}
                >
                  Download
                </a>
                <button
                  onClick={generateAndCopy}
                  className={`${copied ? 'border-green-300 bg-green-100 ':'border-gray-300 '}flex items-center justify-center cursor-pointer gap-1 text-sm text-gray-700 hover:text-black border py-3 min-w-24 text-center rounded-md px-2 transition`}
                >
                  {copied ? <FiCheck className="text-green-600" /> : <FiCopy />} {copied ? "Copied!" : "Copy"}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* RIGHT DETAILS */}
        <div className="flex flex-col gap-4 bg-white border border-blue-300/60 rounded-xl shadow-md relative px-20 py-10 w-full">
          <div className="flex flex-col gap-2">
            <InfoRow label="Document Type">{document?.documentType}</InfoRow>
            <InfoRow label="Content Type">{snakeToCapitalCase(document?.contentType || "N/A")}</InfoRow>
            <InfoRow label="Zone - State">{document?.zone} - {document?.state}</InfoRow>
            <InfoRow label="Language Type">{document?.language}</InfoRow>
            <InfoRow label="Product">{document?.product}</InfoRow>
            <InfoRow label="Brand - Model">{document?.brand} - {document?.model}</InfoRow>
          </div>

          <div>
            <h1 className="text-xl font-bold">Comment</h1>
            <div dangerouslySetInnerHTML={{ __html: document?.comment }} />
          </div>

          <h1 className="text-base font-semibold">History & Ownership</h1>
          <div className="flex gap-2 justify-between bg-gray-50 px-6 py-2 text-lg">
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 mb-1">Created: {formatDateTime(document?.createdAt)}</label>

              <div className="flex items-start gap-2">
                <Avatar src={document?.createdBy?.profilePic} size="md" />

                <div className="flex flex-col">
                  <label>{document?.createdBy?.firstName} {document?.createdBy?.lastName}</label>
                  <label className="capitalize text-gray-500 text-base"> {snakeToCapitalCase(document?.createdBy?.role)}</label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isApproved ? (
                <>
                  <label className="text-gray-400 mb-1">Approved: {formatDateTime(document?.approvedAt)}</label>
                  <div className="flex justify-start items-start gap-2">
                    <Avatar src={document?.approvedBy?.profilePic} size="md" />
                    <div className="flex flex-col">
                      <label>{document?.approvedBy?.firstName} {document?.approvedBy?.lastName}</label>
                      <label className="capitalize text-gray-500 text-base"> {snakeToCapitalCase(document?.approvedBy?.role)}</label>

                    </div>
                  </div>
                </>
              ) : (
                <p>Not Approved</p>
              )}
            </div>
          </div>

          <div className="flex gap-10 mt-6">
            <div className="w-full">
              <Button onClick={handleApproval} color={isApproved ? "red" : "green"}>
                {isApproved ? "Remove Approval" : "Approve"}
              </Button>
            </div>
            <div className="w-full">
              <DeleteBrandComponent
                id={document?._id}
                attachment={document?.attachment?.signedUrl}
                thumbnailUrls={document?.thumbnailUrls}
              />
            </div>
          </div>
        </div>
      </div>

      {message && (
        <p style={{ color: message.includes("failed") ? "red" : "green", marginTop: "10px" }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ViewBrandTreasuryPage;
