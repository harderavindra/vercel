import React from "react";
import StatusMessage from "./StatusMessage"; // Ensure correct import
import { FiRefreshCcw } from "react-icons/fi";

const StatusMessageWrapper = ({ loading, success, error, editSections }) => {
  if (loading) {
    return (
      <StatusMessage variant="progress">
        <div className="flex items-center"> <FiRefreshCcw className="animate-spin mr-2" /> Loading..</div>
      </StatusMessage>
    );
  }

  if (success && !Object.values(editSections || {}).some(Boolean)) {
    return (
      <StatusMessage variant="success">
        {success}
      </StatusMessage>
    );
  }

  if (error) {
    return (
      <StatusMessage variant="failure">
        {error}
      </StatusMessage>
    );
  }

  return null;
};

export default StatusMessageWrapper;
