import { useState } from "react";

const FileViewer = ({ document }) => {
    const [showPopup, setShowPopup] = useState(false);

    const fileUrl = document?.fileUrl;
    const fileName = document?.fileName;
    
    // Extract file extension
    const fileExtension = fileUrl?.split('.').pop()?.toLowerCase();

    // Check if the file is an image or a video
    const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExtension);
    const isVideo = ["mp4", "webm", "ogg"].includes(fileExtension);

    return (
        <div className="flex gap-4">
            {/* Download Link */}
            <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                Download
            </a>

            {/* View Button (Shows popup for image/video) */}
            {(isImage || isVideo) && (
                <Button variant="outline" onClick={() => setShowPopup(true)}>View</Button>
            )}

            {/* Popup for Image/Video Preview */}
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center">
                    <div className="bg-white p-4 rounded-lg max-w-3xl w-full">
                        <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-white text-xl">
                            ✖
                        </button>

                        {isImage && <img src={fileUrl} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg" />}
                        
                        {isVideo && (
                            <video controls className="max-w-full max-h-[80vh] rounded-lg">
                                <source src={fileUrl} type={`video/${fileExtension}`} />
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileViewer;
