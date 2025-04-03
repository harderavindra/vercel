import { FiImage, FiFile, FiPlayCircle } from "react-icons/fi";
import { FaRegFilePdf } from "react-icons/fa";
import { TbFileZip } from "react-icons/tb";

// Icon mapping object
const iconMap = {
  "image/png": FiImage,
  "image/jpeg": FiImage,
  "application/pdf": FaRegFilePdf,
  "text/plain": FiFile,
  "application/msword": FiPlayCircle,
  "application/vnd.ms-excel": FiPlayCircle,
  "application/zip": TbFileZip,
  "video/mp4": FiPlayCircle,
};

// Reusable FileIcon Component
const FileIcon = ({ mimeType, size = 42, className = "text-gray-600" }) => {
  const IconComponent = iconMap[mimeType]; // Get the corresponding icon

  return IconComponent ? (
    <IconComponent size={size} className={className} />
  ) : (
    <span className="text-2xl text-gray-400">❓</span> // Default icon
  );
};

export default FileIcon;
