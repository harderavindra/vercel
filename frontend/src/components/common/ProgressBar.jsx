// ProgressBar.js
import React from 'react';

const ProgressBar = ({ progress }) => {
    return (
        <div className="mb-4 w-full">
            <label className="block mb-1">Upload Progress:</label>
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                            {progress}%
                        </span>
                    </div>
                </div>
                <div className="flex mb-2">
                    <div
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-full"
                        style={{ height: '8px' }}
                    >
                        <div
                            className="bg-red-600 rounded-full"
                            style={{ width: `${progress}%`, height: '100%' }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;
