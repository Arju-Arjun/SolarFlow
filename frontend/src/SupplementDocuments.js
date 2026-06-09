import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilePdf, FaDownload, FaEye } from "react-icons/fa";

const SupplementDocuments = () => {
  const navigate = useNavigate();

  // 💡 Double check your filenames inside public/documents/ match these exactly!
  const documents = [
    {
      id: 1,
      title: "Annexure 1",
      description: "Applicant and site details.",
      fileUrl: "/documents/Annexure_1.pdf",
    },
    {
      id: 2,
      title: "Annexure 2",
      description: "Solar system technical specifications and installation details.",
      fileUrl: "/documents/Annexure_2.pdf",
    },
    {
      id: 3,
      title: "Annexure 3",
      description: "Declaration, consent form, and supporting documents.",
      fileUrl: "/documents/Annexure_3.pdf",
    },
  ];

  const handlePreview = (fileUrl) => {
    // 💡 FIX FOR LOCALHOST TESTING: 
    // If you are testing on localhost, Google Viewer won't work.
    // This condition safely opens the PDF directly in a new browser tab instead of crashing.
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      window.open(fileUrl, "_blank");
    } else {
      // If the site is deployed live online, it uses the official clean Google Docs Viewer
      const absoluteUrl = `${window.location.origin}${fileUrl}`;
      window.open(`https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=true`, "_blank");
    }
  };

  return (
    <div className="supplement-wrapper">
      <div className="supplement-header-row">
        <button 
          className="back-nav-btn" 
          onClick={() => navigate(-1)} 
          aria-label="Go back to profile"
        >
          <FaArrowLeft /> Back to Profile
        </button>
        <h2>Supplement Project Documents</h2>
        <p>Access, view, or download structural compliance and supplementary framework documentation.</p>
      </div>

      <div className="supplement-grid-layout">
        {documents.map((doc) => (
          <div key={doc.id} className="document-asset-card">
            <div className="pdf-icon-indicator">
              <FaFilePdf />
            </div>
            
            <div className="card-info-block">
              <h3>{doc.title}</h3>
              <p>{doc.description}</p>
            </div>

            <div className="card-actions-wrapper">
              {/* 💡 Preview Button now calls our smart local-safe function handler */}
              <button
                onClick={() => handlePreview(doc.fileUrl)}
                className="action-btn preview-btn"
                style={{ cursor: "pointer", border: "1px solid #cbd5e0" }}
              >
                <FaEye /> Preview File
              </button>

              <a
                href={doc.fileUrl}
                download
                className="action-btn download-btn"
              >
                <FaDownload /> Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplementDocuments;