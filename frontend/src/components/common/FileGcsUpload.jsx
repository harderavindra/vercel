import { useState } from "react";
import { FiCloud, FiFolder, FiUploadCloud } from "react-icons/fi";
import { convertSizeToMB } from "../../utils/fileSizeConverter";
import FileIcon from "./FileIcon";

const FileGcsUpload = ({ onFileSelect }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    onFileSelect(selectedFile); // Pass selected file to parent component
  };

  return (
    <div className="flex flex-col items-center justify-center ">
      <input type="file" onChange={handleFileChange} id="fileInput" hidden className="border p-2 rounded" />
      <button   type="button"

        onClick={() => document.getElementById("fileInput").click()}
        className="flex flex-col  items-center justify-center text-center"
      >
        <span className="w-10 h-10 bg-white rounded-full flex justify-center items-center"><FiUploadCloud size={24} className="text-red-500" /> </span>{file ? (<p className="max-w-[200px] truncate overflow-hidden whitespace-nowrap ">File selected to upload</p>) : ("Select a file to upload")}
      </button>
      {file &&
     (<><p className="flex gap-2 items-center"><FileIcon size={18} mimeType={file?.type} />{file?.name}</p>
      <p className="flex gap-2 items-center"><FiFolder /> {convertSizeToMB(file?.size)}</p></> )
      }
      
    </div>
  );
};

export default FileGcsUpload;
