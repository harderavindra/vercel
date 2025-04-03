import React from 'react'

const LoadingCard = () => (
    <div className="flex flex-col gap-2 bg-white animate-pulse border border-gray-300 rounded-lg w-full p-6 px-10">
        <div className="h-6 w-3/4 bg-gray-100 rounded"></div>
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
            <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
        </div>
        <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
        <div className="h-4 w-full bg-gray-100 rounded"></div>
    </div>
);

export default LoadingCard