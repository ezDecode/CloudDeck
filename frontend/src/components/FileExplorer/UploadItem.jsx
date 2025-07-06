import React from "react";
import { motion } from "framer-motion";
import FileIcon from "./FileIcon";
import { formatFileSize } from "../../utils/formatters";

const UploadItem = ({ fileName, progress, speed, remaining, size, uploadedMB, totalMB, part }) => {
  // Handle both old number progress and new object progress
  const progressValue = typeof progress === 'object' ? progress.percentage : progress;
  const isComplete = progressValue === 100;
  
  // Extract enhanced progress information if available
  const progressInfo = typeof progress === 'object' ? progress : null;
  const uploadedSize = progressInfo ? progressInfo.uploadedMB : uploadedMB;
  const totalSize = progressInfo ? progressInfo.totalMB : totalMB;
  const currentPart = progressInfo ? progressInfo.part : part;

  const containerVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: {
      width: `${progressValue}%`,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
    },
  };

  const statusVariants = {
    uploading: { opacity: 1, y: 0 },
    complete: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={`flex items-center p-3 rounded-2xl shadow-sm mb-3 transition-all duration-300 border ${
        isComplete
          ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50"
          : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80"
      }`}
    >
      <div className="flex-shrink-0">
        <FileIcon fileName={fileName} />
      </div>

      <div className="flex-1 ml-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate pr-2">
            {fileName}
          </p>
          <p
            className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
              isComplete
                ? "text-green-600 dark:text-green-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {isComplete ? "Done" : `${Math.round(progressValue)}%`}
          </p>
        </div>

        <div className="relative pt-1">
          <div className="overflow-hidden h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              className={`h-full rounded-full ${
                isComplete
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-blue-500 to-cyan-400"
              }`}
              variants={progressVariants}
              initial="initial"
              animate="animate"
            >
              {!isComplete && (
                <div
                  className="absolute top-0 left-0 h-full w-full opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
                    animation: "shine 2s infinite",
                  }}
                />
              )}
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          <motion.div
            initial={false}
            animate={isComplete ? "complete" : "uploading"}
            variants={statusVariants}
          >
            {isComplete ? (
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Upload complete</span>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                <span>
                  {uploadedSize && totalSize 
                    ? `${uploadedSize} MB / ${totalSize} MB`
                    : size 
                    ? `${formatFileSize(size * (progressValue / 100))} / ${formatFileSize(size)}`
                    : 'Uploading...'
                  }
                </span>
                {currentPart && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Part {currentPart}
                  </span>
                )}
              </div>
            )}
          </motion.div>
          {!isComplete && (
            <div className="flex items-center">
              <span className="tabular-nums">{speed}</span>
              <span className="mx-1">•</span>
              <span className="tabular-nums">{remaining}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UploadItem;

