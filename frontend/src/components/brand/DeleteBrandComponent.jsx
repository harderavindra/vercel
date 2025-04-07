import React from 'react'
import Button from '../common/Button';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DeleteBrandComponent = ({id, thumbnailUrls, attachment}) => {
    const navigate = useNavigate()
    const deleteDocument = async () => {
       
        const confirmation = prompt('Type "DELETE" to confirm document deletion:');
        if (confirmation !== "DELETE") return alert("Deletion canceled");
    
        try {
            const response = await axios.post( `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/deleteBrandTreasuryDocument`, 
                { id, attachment, thumbnailUrls },
                { withCredentials: true }
            );
    
          
                alert("Document deleted successfully!");
                navigate('/')
         
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete document");
        }
    };
  return (
    <div>
        <Button className={'w-full'}  onClick={()=>{deleteDocument()}} >Delete</Button>
    </div>
  )
}

export default DeleteBrandComponent