import React from 'react'
import {motion} from "framer-motion"
const StatusMessage = ({variant, children }) => {
    const success = 'bg-green-50 border border-green-200 text-green-700/80 ';
    const failure = 'bg-red-50 border border-red-200 text-red-700/80 '
    const progress = 'bg-blue-50 border border-blue-300 text-blue-600 ';
    const standard = 'bg-gray-50 border border-gray-300 text-gray-600 ';
    const style = `py-2 px-4 rounded-md mb-2 
     ${
        variant === "success" ? success : variant === "failure" ? failure : standard
    }
    `;
  return (
    <motion.div className={`${style}`}>
        {children}
    </motion.div>
)
}

export default StatusMessage