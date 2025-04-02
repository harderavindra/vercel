import { useState, useEffect } from "react";
import { fetchUsers } from "../api/userApi";

const useFetchUsers = (page = 1, limit = 10, role = "", designation = "", search = "") => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const response = await fetchUsers(page, limit, role, designation, search);
        setUsers(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching users");
      }finally{
      setLoading(false);
    }
    };

    getUsers();
  }, [page, limit, role, designation, search]); // Removed `userType`

  return { users, loading, error, pagination };
};

export default useFetchUsers;
