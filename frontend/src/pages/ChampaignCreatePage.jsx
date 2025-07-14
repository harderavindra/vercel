import { useState } from "react";
import axios from "axios";
import FileUpload from "../components/common/FileGcsUpload";
import { PRIORITY } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import PageTitle from "../components/common/PageTitle";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import Button from "../components/common/Button";
import SelectField from "../components/common/SelectField";
import InputText from "../components/common/InputText";
import ProgressBar from "../components/common/ProgressBar";
import { BRAND_TREASURY_DOCUMENTS, CONTENT_TYPE_DOCUMENTS, LANGUAGES, ZONES } from "../utils/constants";


const CampaignCreatePage = () => {
  const [formData, setFormData] = useState({
    title: "",
    zone: "",
    // typeOfCampaign: "",
    campaignDetails: "",
    dueDate: "",
    attachment: null
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (file) => {
    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(formData)
    try {
      let fileUrl = uploadedFileUrl || "";
      if (formData.attachment && !uploadedFileUrl) {
        const timestamp = Date.now();
        const fileName = `campaign/${timestamp}-${formData.attachment.name}`;

        const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`, {
          fileName,
          fileType: formData.attachment.type,
        });

        await axios.put(data.signedUrl, formData.attachment, {
          headers: { "Content-Type": formData.attachment.type },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
        });

        fileUrl = data.fileUrl;
        setUploadedFileUrl(fileUrl);
      }

      const payload = {
        title: formData.title,
        zone: formData.zone,
        // typeOfCampaign: formData.typeOfCampaign,
        campaignDetails: formData.campaignDetails,
        dueDate: formData.dueDate,
        attachment: fileUrl
      };

      await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/campaigns/`, payload, { withCredentials: true });

      navigate('/campaigns', { state: { success: 'Champaign created successfully!' } });

      setFormData({
        title: "",
        typeOfArtwork: "",
        offerDetails: "",
        dueDate: "",
        attachment: null
      });
      setUploadedFileUrl(null);
    } catch (error) {
      console.error("Error response:", error.response?.data);
      alert("Error creating champaign: " + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="p-5 sm:p-10">
      <div className="flex justify-between items-center pb-4">
        <PageTitle>Create Campaign</PageTitle>

        <StatusMessageWrapper loading={loading} success={success} error={
          error || Object.keys(errors).length > 0
            ? "Please fill all required fields"
            : ''
        } />
        <Button variant="outline" width="auto" onClick={() => navigate('/campaigns')}>Back</Button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-12 justify-between">
        <div className="flex flex-col gap-3 bg-white border border-blue-300/60 rounded-lg p-10  w-full">

          <InputText name="title" label="Title" value={formData.title} handleOnChange={handleChange} placeholder="Title" />
          <SelectField
            label="Zone"
            name="zone"
            value={formData.zone}
            onChange={handleChange}
            options={Object.keys(ZONES)}
          />
          {/* <SelectField
            label="Type of Campaign"
            name="typeOfCampaign"
            value={formData.typeOfCampaign}
            onChange={handleChange}
            options={["Awareness", "Promotional", "Launch", "Reminder"]}
          /> */}
          {/* <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={PRIORITY} /> */}

          <label>Due Date</label>
          <input type="date" label="Due Date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full border border-gray-400 p-2 rounded" />



        </div>
        <div className="flex flex-col gap-3 bg-white border border-blue-300/60 rounded-lg p-10 w-full">

          <textarea name="campaignDetails" value={formData.campaignDetails} onChange={handleChange} placeholder="Campaign Details" className="w-full border border-gray-400 p-2 rounded mb-3" />
          <div className="bg-gray-100 p-4 rounded mb-3">
            <FileUpload onFileSelect={handleFileChange} />
            {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}
          </div>
                    <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Champaign"}</Button>

        </div>

      </form>
    </div>
  );
};

export default CampaignCreatePage;
