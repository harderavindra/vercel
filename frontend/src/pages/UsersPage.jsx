import axios from 'axios';
import React, { useState } from 'react'
import { useEffect } from 'react'
import UserCard from '../components/user/UserCard';
import useFetchUsers from '../hooks/useFetchUsers';
import Pagination from '../components/common/Pagination';
import SearchInput from '../components/user/SearchInput';
import DropdownFilter from '../components/user/DropdownFilter';
import { ROLES, DESIGNATIONS } from '../utils/enums'
import Button from '../components/common/Button';
import { useLocation, useNavigate } from 'react-router-dom';
import PageTitle from '../components/common/PageTitle';
import StatusMessageWrapper from '../components/common/StatusMessageWrapper';

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [designation, setDesignation] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate()
  const { users, loading, error, success, pagination } = useFetchUsers(page, 12, role, designation, debouncedSearch);

  const location = useLocation();
  const successMessage = location.state?.success;

  useEffect(() => {
    if (successMessage) {
      // Optionally clear the state after showing the message
      // This avoids showing the message again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [successMessage]);

  
  useEffect(() => {
    
    if (search.length < 3 && search.length > 0) return;

    setSearchLoading(true);
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setSearchLoading(false);
    }, 600); // 600ms delay

    return () => clearTimeout(handler);
  }, [search]);
  const clearAll = () => {
    setDesignation("");
    setRole("");
    setSearch("");
  };

  

  return (
    <div className='p-10'>
      <div className="flex justify-between items-center pb-4">
        <PageTitle>Users</PageTitle>
        
        <StatusMessageWrapper loading={searchLoading} success={successMessage || (success ? "Data fetched successfully!" : "")} error={error} />
        <Button width="auto" onClick={() => navigate('/adduser')}>Add User</Button>
      </div>
      <div>
        <div className="flex mb-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 relative">
            <div className='relative'>
              <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); }} className="sm:w-sm h-10"
                onClear={() => {
                  setSearch("");
                  setSearchLoading(false);
                }
                } placeholder="Search by name (min 3 chars)" />
              {search.length > 0 && search.length < 3 && (
                <span className="text-red-500 text-xs  absolute right-15 inset-y-2">Enter at least 3 characters</span>
              )}
            </div>

            <DropdownFilter
              options={{
                label: 'Roles',
                items: Object.entries(ROLES).map(([key, value]) => ({ value, label: key.replace('_', ' ') })),
              }}
              value={role}
              onChange={(e) => setRole(e.target.value.toLowerCase())}
              onClear={() => setRole("")}
            />
            <DropdownFilter
              options={{
                label: 'Designations',
                items: [...DESIGNATIONS.INTERNAL, ...DESIGNATIONS.VENDOR].map((designation) => ({
                  value: designation,
                  label: designation.replace('_', ' '),
                })),
              }}
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              onClear={() => setDesignation('')}
            />
            {
              (designation || role || search) && (
                <button className="border border-blue-300 bg-blue-50 rounded-md px-3 text-blue-600 cursor-pointer" onClick={clearAll}>
                  Clear All
                </button>
              )
            }

          </div>
          <div>
          </div>
        </div>

      </div>

      <div className="grid  sm:grid-cols-4 gap-10 mt-10">
        {(loading || searchLoading
          ? Array(4).fill({ isPlaceholder: true })
          : users.length > 0
            ? users
            : [{ isEmpty: true }]
        ).map((user, index) => (
          <UserCard
            key={user._id || index}
            user={user}
            loading={loading || searchLoading}
            isEmpty={user.isEmpty}
          />
        ))}
      </div>
      <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={setPage} />

    </div>
  )
}

export default UsersPage