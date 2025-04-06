import React, { useState } from 'react'
import PageTitle from '../components/common/PageTitle'
import StatusMessageWrapper from '../components/common/StatusMessageWrapper'
import Button from '../components/common/Button'
import { useAuth } from '../context/auth-context'
import { hasAccess } from '../utils/permissions'
import { useLocation, useNavigate } from 'react-router-dom'

const BrandList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
      const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.successMessage || "");

  return (
    <div className="p-10">
      {/* Header Section */}
      <div className="flex justify-between items-center pb-4">
        <PageTitle>Brand Treasury</PageTitle>
        <StatusMessageWrapper loading={loading} success={success} error={error} />
        {hasAccess(user?.role, ['marketing_manager', 'admin', 'zonal_marketing_manager']) && (
          <Button width="auto" onClick={() => navigate('/create-brand-treasury')}>
            Add Brand Treasury
          </Button>
        )}
      </div>
    </div>
  )
}

export default BrandList