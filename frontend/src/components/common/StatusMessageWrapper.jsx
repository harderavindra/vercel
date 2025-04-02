import React from "react";
import StatusMessage from "./StatusMessage"; // Ensure correct import

const StatusMessageWrapper = ({ loading, success, error, editSections }) => {
  if (loading) {
    return (
      <StatusMessage variant="progress">
        Loading..
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
