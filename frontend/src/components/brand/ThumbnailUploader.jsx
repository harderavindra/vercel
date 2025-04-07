import { useRef, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiMaximize2, FiMinimize2, FiTrash2, FiUploadCloud } from "react-icons/fi";
import Button from '../common/Button'
import StatusMessageWrapper from "../common/StatusMessageWrapper";
import ProgressBar from "../common/ProgressBar";
const ThumbnailUploader = ({ fileId, thumbnails, setThumbnails }) => {
    
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [thumbSuccess, setThumbSuccess] = useState("");
    const [thumbError, setThumbError] = useState("");
    const [loading, setLoading] = useState(false);
    const sliderRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fileInputRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);


    const totalSlides = thumbnails.length;
    useEffect(() => {
        console.log(thumbnails, 'thumbnails')
    }, [])

    const toggleFullscreen = () => {
        setIsFullscreen((prev) => !prev);
    };

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) {
            setMessage("Please select a file.");
            return;
        }

        if (thumbnails.length >= 4) {
            setMessage("You can only upload up to 4 images.");
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            const timestamp = Date.now();
            const folderName = "brand-treasury-thumbs";
            const fileNameWithFolder = `${folderName}/${timestamp}-${file.name}`;

            // Step 1: Get signed URL from backend
            const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`,
                {
                    fileName: fileNameWithFolder,
                    fileType: file.type,
                }
            );

            if (!data.signedUrl) throw new Error("Failed to get signed URL");

            // Step 2: Upload to GCS
            await axios.put(data.signedUrl, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                },
            });

            // Step 3: Save URL to DB
            const uploadedUrl = data.fileUrl;
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/update-thumbnail/${fileId}`,
                { thumbnailUrl: uploadedUrl },
                { withCredentials: true }
            );

            // Step 4: Add to thumbnail list (functional state update)
            if (response.data.thumbnailUrl) {
                setThumbnails(prev => [...prev, response.data.thumbnailUrl]);
                setThumbSuccess("Thumbnail uploaded successfully!");
                setCurrentIndex(thumbnails.length); // Optional
            } else {
                setThumbError("Upload succeeded but response was invalid.");
            }

        } catch (error) {
            console.error("Upload failed:", error);
            setThumbError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 2000);
        }
    };
    const deleteThumbImage = async (imageUrl, index) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/delete-thumbnail`,
                { fileId, imageUrl },
                { withCredentials: true }
            );

            // Check response from backend
            if (response.data?.success) {
                setThumbnails(prev => prev.filter(img => img !== imageUrl));
                setThumbSuccess("Thumbnail deleted successfully!");
                setCurrentIndex(0);
            } else {
                setThumbError("Error deleting thumbnail: " + response.data?.message);
            }

        } catch (error) {
            console.error("Delete error:", error);
            setThumbError("Failed to delete thumbnail");
        }
    };

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    };

    // Function to go to previous slide
    const prevSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? totalSlides - 1 : prevIndex - 1
        );
    };
    const goToSlide = (index) => {
        setCurrentIndex(index);
    };


    const handleButtonClick = () => {
        fileInputRef.current.click(); // Trigger file input click
    };

    return (
        <div>
            <div
                ref={sliderRef}
                className={` w-full ${isFullscreen ? "fixed top-0 left-0 z-50 w-screen h-screen p-10 bg-black/40" : "relative"}`}
                style={{ scrollSnapType: "x mandatory", whiteSpace: "nowrap" }}>
                      <button
                        onClick={toggleFullscreen}
                        className={`${isFullscreen ? "right-8  p-3":"right-2  p-1"} cursor-pointer absolute top-4  z-10 bg-white/90 rounded-full text-gray-700 hover:bg-white transition`}
                    >
                        {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                    </button>

                {thumbnails.length > 0 ? (
                    <>
                        <div className={`${isFullscreen ? "h-full" : "h-[200px] " } relative w-full `}>
                            {
                                thumbnails.map((thumbnail, index) => (
                                    <div key={index}
                                        className={`${isFullscreen ? " p-10" : " p-0" } absolute inset-0 transition-opacity duration-700 h-full   ${index === currentIndex ? "opacity-100" : "opacity-0"
                                            }`}
                                    >
                                        {/* <p>Thumb {index + 1} - <span>{thumbnail.split('/').pop()}</span></p> */}
                                        <img src={thumbnail} alt={`Thumbnail ${index + 1}`} className={`${isFullscreen ? 'object-contain' :'object-cover'} w-full h-full  object-center rounded-md`} />
                                        <button onClick={() => deleteThumbImage(thumbnail)}
                                            className={`${isFullscreen ? "right-8  p-3":"right-2  p-1"} absolute  bg-white/90 rounded-lg flex items-center justify-center bottom-4 right-4 cursor-pointer`}
                                        ><FiTrash2 size={14} /></button>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="transform  flex justify-center items-center gap-2 py-3 w-full">
                            <span className="mr-auto" > Reference Images {currentIndex + 1}/{thumbnails.length}</span>
                            <button onClick={prevSlide} className="w-6 h-6 bg-gray-200 flex justify-center items-center rounded-full cursor-pointer"><FiChevronLeft /></button>
                            {thumbnails.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-3 h-3 rounded-full cursor-pointer ${index === currentIndex ? "bg-gray-600" : "bg-gray-300"
                                        }`}
                                > </button>
                            ))}
                            <button onClick={nextSlide} className="w-6 h-6 bg-gray-200 flex justify-center items-center rounded-full cursor-pointer"><FiChevronRight /></button>
                        </div>
                    </>
                ) : (
                    <div className=" h-[180px] bg-gray-800 rounded-md flex justify-center items-center text-gray-400">
                        <p>No reference image uploaded.</p>
                    </div>
                )}
            </div>



            {thumbnails.length < 4 && (
                <div >
                    <input type="file" accept="image/*" hidden onChange={handleThumbnailUpload} ref={fileInputRef} disabled={uploading} />
                    {uploadProgress > 0 && (
                        <ProgressBar progress={uploadProgress} />
                    )}
                    <button className="flex  border w-full justify-center items-center gap-2 my-3 rounded-md py-1 bg-amber-100 border-amber-300 text-amber-800 cursor-pointer" onClick={handleButtonClick} disabled={uploading}><FiUploadCloud /> Add New Image</button>
                </div>
            )}

            {<StatusMessageWrapper error={thumbError} success={thumbSuccess} />}


        </div>

    );
};

export default ThumbnailUploader;
