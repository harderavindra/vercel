import { useRef, useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiTrash2, FiUploadCloud } from "react-icons/fi";
import Button from '../common/Button'
const ThumbnailUploader = ({ fileId, thumbnails, setThumbnails }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const sliderRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fileInputRef = useRef(null);

    const totalSlides = thumbnails.length;
    useEffect(() => {
        console.log(thumbnails, 'thumbnails')
    }, [])

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
    
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
            const folderName = "job";
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
    
            // Step 2: Upload the file to GCS using the signed URL
            await axios.put(data.signedUrl, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                },
            });
    
            // Step 3: Save the file URL (data.fileUrl assumed from your backend)
            const uploadedUrl = data.fileUrl;
    
            // Optional: send the file URL to your backend to save it (depends on your app logic)
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/update-thumbnail/${fileId}`,
                { thumbnailUrl: uploadedUrl }, // send only URL now
                {
                    withCredentials: true, // Only withCredentials, no headers
                }
            );
    
            // Step 4: Update UI state
            setThumbnails([...thumbnails, response.data.thumbnailUrl]);
            setMessage("Thumbnail uploaded successfully!");
        } catch (error) {
            console.error("Upload failed:", error);
            setMessage("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 2000);
        }
    };
    const deleteThumbImage = async (imageUrl) => {
        if (!window.confirm("Are you sure you want to delete this thumbnail?")) return;

        try {
            const response = await axios.post(
               `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/delete-thumbnail`,
                { fileId, imageUrl },
                { withCredentials: true }
            );

            if (response.data.success) {
                setThumbnails(thumbnails.filter(img => img !== imageUrl)); // Remove from state
                setMessage("Thumbnail deleted successfully!");
            } else {
                alert("Error deleting thumbnail: " + response.data.message);
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete thumbnail");
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
        console.log('index')
        setCurrentIndex(index);
    };

 
    const handleButtonClick = () => {
        fileInputRef.current.click(); // Trigger file input click
    };

    return (
        <div>
            <div
                ref={sliderRef}
                className=" w-full"
                style={{ scrollSnapType: "x mandatory", whiteSpace: "nowrap" }}
            >
               
                {thumbnails.length > 0 ? (
                    <>
                     <div className="relative h-[180px] ">
                    {
                    thumbnails.map((thumbnail, index) => (
                        <div key={index}
                            className={`absolute inset-0 transition-opacity duration-700 h-[180px]  ${index === currentIndex ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            {/* <p>Thumb {index + 1} - <span>{thumbnail.split('/').pop()}</span></p> */}
                            <img src={thumbnail} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover object-center rounded-md" />
                            <button onClick={() => deleteThumbImage(thumbnail)}
                                className="absolute w-6 h-6 bg-white/50 rounded-lg flex items-center justify-center top-4 right-4"
                            ><FiTrash2 size={14} /></button>
                        </div>
                    ))
                    }
                      </div>
                    <div className="transform  flex justify-center items-center gap-2 py-3">
                    <span className="mr-auto" > Reference Images {currentIndex+1}/{thumbnails.length}</span>
                    <button onClick={prevSlide} className="w-6 h-6 bg-gray-200 flex justify-center items-center rounded-full"><FiChevronLeft  /></button>
                    {thumbnails.map((_, index) => (
                        <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full ${index === currentIndex ? "bg-gray-600" : "bg-gray-300"
                        }`}
                        > </button>
                    ))}
                    <button onClick={nextSlide} className="w-6 h-6 bg-gray-200 flex justify-center items-center rounded-full"><FiChevronRight  /></button>
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
                    <input type="file" accept="image/*" hidden onChange={handleThumbnailUpload}  ref={fileInputRef} disabled={uploading} />
                    {uploading && <p>Uploading... {uploadProgress}%</p>}
                    <button className="flex  border w-full justify-center items-center gap-2 my-3 rounded-md py-1 bg-gray-100" onClick={handleButtonClick}  disabled={uploading}><FiUploadCloud/> Add New Image</button>
                </div>
            )}

            {message && <p>{message}</p>}


        </div>

    );
};

export default ThumbnailUploader;
