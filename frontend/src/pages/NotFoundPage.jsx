import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800 text-center p-6">
            <motion.h1
                className="text-9xl font-bold mb-4 text-red-600"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                404
            </motion.h1>

            <motion.p
                className="text-lg mb-6 text-gray-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                Oops! The page you're looking for doesn't exist.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <Link
                    to="/"
                    className="px-6 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300"
                >
                    Go Home
                </Link>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
