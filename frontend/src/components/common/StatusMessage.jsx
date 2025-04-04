import React from 'react';
import { motion } from 'framer-motion';

const StatusMessage = ({ variant = "standard", children }) => {
  const variants = {
    success: 'bg-green-50 border border-green-200 text-green-700/80',
    failure: 'bg-red-50 border border-red-200 text-red-700/80',
    progress: 'bg-blue-50 border border-blue-300 text-blue-600',
    standard: 'bg-gray-50 border border-gray-300 text-gray-600',
  };

  const style = `py-2 px-4 rounded-md mb-2 ${variants[variant] || variants.standard}`;

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className={style}
    >
      {children}
    </motion.div>
  );
};

export default StatusMessage;
