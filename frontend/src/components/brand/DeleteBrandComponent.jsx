import React from 'react'
import Button from '../common/Button';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DeleteBrandComponent = ({id, thumbnailUrl, storagePath}) => {
    const navigate = useNavigate()
    const deleteDocument = async () => {
        console.log(id,thumbnailUrl)
       
        const confirmation = prompt('Type "DELETE" to confirm document deletion:');
        if (confirmation !== "DELETE") return alert("Deletion canceled");
    
        try {
            const response = await axios.post("http://localhost:3000/api/upload/delete-document", 
                { id, storagePath, thumbnailUrl },
                { headers: { "Content-Type": "application/json" } }
            );
    
            if (response.data.success) {
                alert("Document deleted successfully!");
                navigate('/')
            } else {
                alert("Error deleting document: " + response.data.message);
            }
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