import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center p-10">
            <button
                className="bg-gray-200 px-4 py-2 rounded-md mx-2"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Prev
            </button>
            <span className="text-gray-600">
                Page {currentPage} of {totalPages}
            </span>
            <button
                className="bg-gray-200 px-4 py-2 rounded-md mx-2"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;
