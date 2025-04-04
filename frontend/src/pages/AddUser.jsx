import React, { useState } from 'react'
import { GENDER } from '../utils/enums'
import { snakeToCapitalCase } from '../utils/convertCase';
import Button from '../components/common/Button';
import InputText from '../components/common/InputText';
import { states, citySuggestions } from "../utils/constants";
import { ROLES, DESIGNATIONS, USER_TYPES } from '../utils/enums'
import StatusMessageWrapper from '../components/common/StatusMessageWrapper';
import ProgressBar from '../components/common/ProgressBar';
import axios from 'axios';
import PageTitle from '../components/common/PageTitle';
import Avatar from '../components/common/Avatar';
import { FiUploadCloud } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
const AddUser = () => {
    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [cityOptions, setCityOptions] = useState([]); // Suggested cities
    const [loading, setLoading] = useState(false); // Loading state
    const [fileName, setFileName] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submissions
    const [uploadProgress, setUploadProgress] = useState(0); // State for progress

    const [profilePic, setProfilePic] = useState(null);
    const [previewURL, setPreviewURL] = useState(null);
    const commonSelectStyles = "px-3 py-2 pr-8 border border-gray-400 rounded-md focus:outline-0 focus:border-blue-400 bg-white";


    const [dataFields, setDataFields] = useState({
        firstName: "",
        lastName: "",
        email: "",
        contactNumber: "",
        password: "",
        userType: "",
        role: "",
        designation: "",
        gender: "",
        location: { city: "", state: "", country: "" }
    });
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        const validTypes = ["image/jpeg", "image/png"];
        if (!validTypes.includes(selectedFile.type)) {
            alert("Please upload a JPG or PNG file.");
            return;
        }

        setProfilePic(selectedFile);
        setFileName(selectedFile.name);
        setPreviewURL(URL.createObjectURL(selectedFile));
    };
    const handleOnChange = (e) => {
        const { name, value } = e.target;
        if (name === "role" || name === "gender") {
            setDataFields((prev) => ({ ...prev, role: value.toLowerCase() }))
            console.log(value)
        }
        if (name === "state") {
            setDataFields((prev) => ({
                ...prev,
                location: { ...prev.location, state: value, city: "" }, // Reset city when state changes
            }));
            setCityOptions(citySuggestions[value] || []); // Update city options
        } else if (name === "city") {
            setDataFields((prev) => ({
                ...prev,
                location: { ...prev.location, city: value },
            }));
        } else if (["city", "state", "country"].includes(name)) {
            setDataFields((prev) => ({
                ...prev,
                location: { ...prev.location, [name]: value.trim() },
            }));
        } else {
            setDataFields((prev) => ({ ...prev, [name]: value.trim() }));
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        // Validation check
        if (!dataFields.firstName || !dataFields.lastName || !dataFields.email || !dataFields.password) {
            setError("Please fill in all required fields.");
            setIsSubmitting(false);
            return;
        }

        try {
            const userData = {
                ...dataFields,
                userType: dataFields.userType, // ✅ Convert to lowercase

            };



            let uploadedUrl = "";

            // If a profile picture is selected, upload it first
            if (profilePic) {
                const timestamp = Date.now();
                const folderName = "user-profiles";
                const fileNameWithFolder = `${folderName}/${timestamp}-${profilePic.name}`;

                // Get signed URL from backend
                const { data } = await axios.post(
                    `${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`,
                    { fileName: fileNameWithFolder, fileType: profilePic.type }
                );

                if (!data.signedUrl) throw new Error("Failed to get signed URL");

                // Upload file to Google Cloud using signed URL
                await axios.put(data.signedUrl, profilePic, {
                    headers: { "Content-Type": profilePic.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted); // Update the progress state

                        console.log("Upload Progress:", percentCompleted + "%");
                    },
                });

                uploadedUrl = data.fileUrl; // Use the file URL from the response
            }
            userData.profilePic = uploadedUrl;

            // Submit user data to backend
            await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/users`, userData, { withCredentials: true });

            navigate('/users', { state: { success: 'User added successfully!' } });


            setDataFields({
                firstName: "",
                lastName: "",
                email: "",
                contactNumber: "",
                password: "",
                userType: "",
                designation: "",
                location: { city: "", state: "", country: "" },
            });
        } catch (err) {
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className=' p-10'>
            <div className="flex justify-between items-center pb-4">
                <PageTitle>Artwork Requests</PageTitle>
                <StatusMessageWrapper loading={loading} success={success} error={error} />
                <Button width="auto" onClick={() => navigate('/create-artwork')}>
                    Add Artwork
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className='flex  gap-20'>

                    <div className='bg-white rounded-lg border border-blue-300/70 flex flex-col min-h-full min-w-[20%] items-center p-4  gap-3 '>

                        <div className="mb-4 flex flex-col justify-center items-center gap-4">
                            <Avatar src={previewURL} size='xl' />
                            <input
                                type="file"
                                accept=".jpg, .jpeg, .png"
                                onChange={handleFileChange}
                                id="fileInput"
                                style={{ display: "none" }}
                              
                            />

                             <button type='button'
                                                    onClick={() => document.getElementById("fileInput").click()}
                                                    className="bg-amber-50 py-2 border border-amber-100 text-red-500 w-full rounded-md flex justify-center items-center gap-2 px-3"
                                                >
                                                    <FiUploadCloud size={18} /> Select a file to upload
                                                </button>

                            {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />} {/* Display progress bar */}
                        </div>
                        <div className='w-full flex flex-col gap-1'>
                                    <label>Gender</label>
                                    <select value={dataFields.gender} name="gender" onChange={handleOnChange} 
                                    className={`${commonSelectStyles} w-full `}>
                                        <option value="">Select</option>
                                        {Object.values(GENDER).map((gender) => (
                                            <option key={gender} value={gender}>{snakeToCapitalCase(gender)}</option>
                                        ))}
                                    </select>
                                </div>
                                <InputText name="firstName" value={dataFields.firstName} label="First Name" handleOnChange={handleOnChange} />
                                <InputText name="lastName" value={dataFields.lastName} label="Last Name" handleOnChange={handleOnChange} />
                    </div>

                   

                    <div className='flex flex-col gap-4 bg-white border border-blue-300/60 rounded-lg w-fit p-6 px-10'>




                        <div className='w-3xl flex flex-col gap-3'>
                            <div className='flex gap-8'>

                               
                            </div>
                            <div className='flex gap-8'>

                                
                            </div>

                            <div className='flex gap-8'>
                                <InputText name="email" value={dataFields.email} label="Email" handleOnChange={handleOnChange} />
                                <InputText name="contactNumber" value={dataFields.contactNumber} label="Contact Number" handleOnChange={handleOnChange} />
                            </div>
                            <div className='flex gap-4'>
                                <div className='flex flex-col gap-1 w-full'>
                                    <label>State</label>
                                    <select
                                         className={`${commonSelectStyles} w-full `}
                                        name="state"
                                        value={dataFields.location.state}
                                        onChange={handleOnChange}
                                    >
                                        <option value="">Select State</option>
                                        {states.map((state) => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex flex-col gap-1 w-full'>
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={dataFields.location.city}
                                        onChange={handleOnChange}
                                        placeholder="Start typing city..."
                                        className="w-full border border-gray-400 rounded-md py-1 px-2"
                                        list="cityList"
                                    />
                                    <datalist id="cityList">
                                        {cityOptions.map((city) => (
                                            <option key={city} value={city} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className='flex gap-8'>
                                <InputText name="password" value={dataFields.password} label="Password" handleOnChange={handleOnChange} />
                                <div className='w-full'>
                                    <label>Role</label>
                                    <select  className={`${commonSelectStyles} w-full `} name='role' value={dataFields.role} onChange={handleOnChange} >
                                        {Object.values(ROLES).map((role) => (
                                            <option key={role} value={role}>{snakeToCapitalCase(role)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className='flex gap-8'>
                                <div className='flex flex-col gap-1 w-full'>
                                    <label>User Type</label>
                                    <select
                                         className={`${commonSelectStyles} w-full `}
                                        name="userType"
                                        value={dataFields.userType}
                                        onChange={(e) => {
                                            setDataFields((prev) => ({
                                                ...prev,
                                                userType: e.target.value,
                                                designation: "",
                                            }));
                                        }}
                                    >
                                        <option value="">Select User Type</option>
                                        {
                                            Object.values(USER_TYPES).map(type => (
                                                <option key={type} value={type}>{snakeToCapitalCase(type)}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className='flex flex-col gap-1 w-full'>
                                    <label>Designation</label>
                                    <select
                                         className={`${commonSelectStyles} w-full `}
                                        name="designation"
                                        value={dataFields.designation}
                                        onChange={handleOnChange}
                                        disabled={!dataFields.userType}
                                    >
                                        <option value="">Select Designation</option>
                                        {DESIGNATIONS[dataFields.userType.toUpperCase()]?.map((designation) => (
                                            <option key={designation} value={designation}>
                                                {snakeToCapitalCase(designation)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className='flex gap-3'>
                            <Button type='submit'>Add</Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AddUser