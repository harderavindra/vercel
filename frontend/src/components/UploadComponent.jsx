import React, { useState } from 'react'


const UploadComponent = () => {
    const [attachment, setAttachment] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const handleFileChange = ()=>{

    }
    const handleUpload = ()=>{
        
    }
  return (
    <div>
          <div>sd
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            <p>Upload Progress: {uploadProgress}%</p>
        </div>
    </div>
  )
}

export default UploadComponent