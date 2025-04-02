import React, { useEffect, useState } from 'react'
import axios from "axios";
import { getViewOrDownload } from "../utils/getViewOrDownload";
import Avatar from "../components/common/Avatar";
import UserCard from '../components/user/UserCard';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

     useEffect(() => {
        setLoading(true)
         const fetchUsers = async () => {
             try {
                 const response = await axios.get(
                     `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users`
                 );
                
                 setUsers(response.data);
             } catch (error) {
                 console.error("Error fetching users:", error);
             }finally{
                setLoading(false)

                 }
         };
 
         fetchUsers();
     }, []);
 
     return (
        <>
        
         <div className="grid grid-cols-4 gap-10">
         {(loading 
           ? Array(4).fill({ isPlaceholder: true })
           : users.length > 0
             ? users
             : [{ isEmpty: true }]
         ).map((user, index) => (
           <UserCard
             key={user._id || index}
             user={user}
             loading={loading }
             isEmpty={user.isEmpty}
           />
         ))}
       </div>
       </>
     );
}

export default UsersPage