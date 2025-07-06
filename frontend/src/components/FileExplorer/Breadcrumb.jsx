import React from "react";
import { getStoredCredentials } from "../../services/aws/s3Service";

export default function Breadcrumb({ path, onNavigate }) {
  const parts = path.split("/").filter(Boolean);
  const credentials = getStoredCredentials();
  const bucketName = credentials?.bucketName || "Root";
  
  return (
    <nav className="flex items-center space-x-2 text-[16px] md:text-[18px] font-[300] text-text-secondary">
      <button
        onClick={() => onNavigate("")}
        className="hover:text-text-primary flex items-center transition-colors duration-300"
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        {bucketName}
      </button>
      
      {parts.map((part, index) => {
        const pathToHere = parts.slice(0, index + 1).join("/") + "/";
        const isLast = index === parts.length - 1;
        
        return (
          <React.Fragment key={pathToHere}>
            <span className="text-text-placeholder">/</span>
            {isLast ? (
              <span className="text-text-primary font-[400]">{part}</span>
            ) : (
              <button
                onClick={() => onNavigate(pathToHere)}
                className="hover:text-text-primary transition-colors duration-300"
              >
                {part}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
