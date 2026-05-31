import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const sectionDefinitions = [
  {
    key: "profile",
    label: "Profile",
    getData: (data) => data.customer || data,
    requiredFields: ["name", "place", "capacity", "mobile"],
  },
  {
    key: "site",
    label: "Site Visit",
    getData: (data) => data.siteVisit || data.site_visit,
    requiredFields: [
      "panel_capacity",
      "system_capacity",
      "project_cost",
      "location",
      "quotation_file",
      "agreement_file",
      "aadhaar",
      "pan",
      "kseb_bill",
      "bank_passbook",
      "land_tax",
      "building_tax",
      "signature",
      "load_enhancement",
      "ownership_change",
    ],
  },
  {
    key: "mnre",
    label: "MNRE Profile",
    getData: (data) =>
      data.mnreProfile || data.mnre || data.mnre_profile,

    requiredFields: (data) =>
      !data?.enabled ? [] : ["mnre_status","feasibility_file","ack_file"],
  },
  {
    key: "payment",
    label: "Payment Flow",
    getData: (data) => data.payment,
    requiredFields: ["advance", "total_received", "balance_due"],
  },
  {
    key: "loan",
    label: "Bank Loan",
    getData: (data) => data.loanProfile || data.loan || data.loan_profile,


    requiredFields: (data) =>
     !data?.enabled ? [] : ["ack_file","status","submission","first_payment","second_payment",],
  },
  {
    key: "kseb",
    label: "KSEB",
    getData: (data) => data.ksebProfile || data.kseb || data.kseb_profile,
    requiredFields: [
      "name_change",
      "load_enhance",
      "feasibility",
      "fee_paid",
      "name_change_status",
      "load_enhance_status",
    ],
  },
  {
    key: "material_delivery",
    label: "Material Delivery",
    getData: (data) => data.materialDelivery || data.material_delivery,
    requiredFields: [
      
      "electrical_delivered",
      "structure_delivered",
      "panel_delivered",
    ],
  },
  {
    key: "installation",
    label: "Installation",
    getData: (data) => data.installation,
    requiredFields: ["electrical_installed", "structure_installed","geo_images"],
  },
  {
    key: "kseb_registration",
    label: "KSEB Registration",
    getData: (data) =>
      data.kseb_registration || data.ksebRegistration,
    requiredFields: [
      "registration_submitted",
      "completion_submitted",
      "agreement_submitted",
      "payment_done",
      "plant_energized",
      "wifi",
      "wifi_configured",
    ],
  },
  {
    key: "dcr",
    label: "DCR",
    getData: (data) => data.dcr,
    requiredFields: [
      "certificate_received",
      "certificate_claimed",
      "certificate_sold",
    ],
  },
  {
    key: "mnre_installation",
    label: "MNRE Installation",
    getData: (data) =>
      data.mnre_installation || data.mnreInstallation,
    requiredFields: [
      "installation_status",
      "approval_status",
      "subsidy_status",
    ],
  },
  {
    key: "service",
    label: "Service",
    getData: (data) => data.services || data.service || [],
    requiredFields: ["project_id"],
  },
];

const routeTemplates = {
  profile: (id) => `/customer/${id}`,
  site: (id) => `/customer/${id}?tab=site`,
  mnre: (id) => `/customer/${id}?tab=mnre`,
  payment: (id) => `/customer/${id}?tab=payment`,
  loan: (id) => `/customer/${id}?tab=loan`,
  kseb: (id) => `/customer/${id}?tab=kseb`,
  material_delivery: (id) => `/customer/${id}?tab=material_delivery`,
  installation: (id) => `/customer/${id}?tab=installation`,
  kseb_registration: (id) => `/customer/${id}?tab=kseb_registration`,
  dcr: (id) => `/customer/${id}?tab=dcr`,
  mnre_installation: (id) => `/customer/${id}?tab=mnre_installation`,
  service: (id) => `/customer/${id}?tab=service`,
};

const isTruthyField = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// =========================
// SECTION COMPLETE CHECK
// =========================
const isSectionComplete = (section, workflowData) => {
  const data = section.getData(workflowData);

// mnre profile
 if (section.key === "mnre") {

  if (!data) return true;

  if (!data.enabled) return true;

  const fields = [
    "mnre_status",
    "feasibility_file",
    "ack_file",
  ];

  return fields.every((field) =>
    isTruthyField(data[field])
  );
}


//payments

if (section.key === "payment") {
  if (!data) return false;

  return (
    Number(data.advance) > 0 &&
    Number(data.total_received) > 0 &&
    Number(data.balance_due) <= 0
  );
}


// bank loan

if (section.key === "loan") {

  if (!data) return true;

  if (!data.enabled) return true;

  const fields = [
    "ack_file",
    "status",
    "submission",
    "first_payment",
    "second_payment",
  ];

  
  const invalidPayments =
    Number(data.first_payment) <= 0 ||
    Number(data.second_payment) <= 0;

  if (invalidPayments) return false;

  return fields.every((field) =>
    isTruthyField(data[field])
  );
}


// kseb
if (section.key === "kseb") {

  if (!data) return false;

  // 🔥 BASE CONDITIONS
  if (data.feasibility !== "Yes") return false;
  if (data.fee_paid !== "Yes") return false;

  // 🔥 CONDITIONAL RULES
  if (
    data.name_change === "Yes" &&
    data.name_change_status !== "Completed"
  ) return false;

  if (
    data.load_enhance === "Yes" &&
    data.load_enhance_status !== "Completed"
  ) return false;

  return true;
}


// material delivery

if (section.key === "material_delivery") {
  if (!data) return false;

  return (
    data.electrical_delivered === true &&
    data.structure_delivered === true &&
    data.panel_delivered === true
  );
}

//installation
if (section.key === "installation") {
  if (!data) return false;

  const hasImages =
    data.geo_images &&
    data.geo_images.length > 0;

  return (
    data.electrical_installed === true &&
    data.structure_installed === true &&
    hasImages
  );
}

//kseb_registration
if (section.key === "kseb_registration") {
  if (!data) return false;

  if (data.wifi === true && data.wifi_configured !== true) return false;

  return (
    data.registration_submitted === true &&
    data.completion_submitted === true &&
    data.agreement_submitted === true &&
    data.payment_done === true &&
    data.plant_energized === true
  );
}

//DCR
if (section.key === "dcr") {
  if (!data) return false;

  return (data.certificate_received === true && data.certificate_claimed === true);
}


//mnre installation
if (section.key === "mnre_installation") {
   if (!data) return false;
   
   return (
     data.installation_status === "Completed" &&
     data.approval_status === "Approved" &&
     data.subsidy_status === "Received"
   );
}

// service
if (section.key === "service") {
  const data = section.getData(workflowData);
  return Array.isArray(data) && data.length > 0;
}



  if (!data) return false;

  const requiredFields =
    typeof section.requiredFields === "function"
      ? section.requiredFields(data)
      : section.requiredFields;

  return requiredFields.every((field) => {
    if (field === "services") {
      return Array.isArray(data?.services)
        ? data.services.length > 0
        : isTruthyField(data?.services);
    }

    return isTruthyField(data[field]);
  });
};
// =========================
// FIELD NAME FORMATTER
// =========================
const humanizeFieldName = (field) => {
  if (!field) return "";

  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// =========================
// MISSING FIELDS
// =========================
const getMissingFields = (section, workflowData) => {
  const data = section.getData(workflowData);

  const requiredFields =
    typeof section.requiredFields === "function"
      ? section.requiredFields(data)
      : section.requiredFields;

  if (!data) {
    return requiredFields.map(humanizeFieldName);
  }

  return requiredFields
    .filter((field) => {
      if (field === "services") {
        return Array.isArray(data?.services)
          ? data.services.length === 0
          : !isTruthyField(data?.services);
      }

      return !isTruthyField(data[field]);
    })
    .map(humanizeFieldName);
};

// =========================
// COMPONENT
// =========================
const WorkflowDiagram = ({ workflowData = {}, customerId }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleNavigate = (stepKey) => {
    if (!customerId) return;

    const path = routeTemplates[stepKey]
      ? routeTemplates[stepKey](customerId)
      : `/customer/${customerId}`;

    navigate(path);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const steps = sectionDefinitions.map((section) => ({
    ...section,
    complete: isSectionComplete(section, workflowData),
    missingFields: getMissingFields(section, workflowData),
  }));

  const completedCount = steps.filter((step) => step.complete).length;

  const progressValue = steps.length
    ? Math.round((completedCount / steps.length) * 100)
    : 0;

  return (
    <div className="workflow-container">
      <div className="workflow-diagram-wrapper">
        <div
        className="workflow-diagram"
        style={
          isMobile
            ? {
                flexDirection: "column",
                alignItems: "stretch",
                gap: "12px",
              }
            : undefined
        }
      >
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div
                className="workflow-step-wrapper"
                style={
                  isMobile
                    ? {
                        minWidth: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }
                    : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => handleNavigate(step.key)}
                  className={`workflow-step-button ${
                    step.complete ? "completed" : "pending"
                  }`}
                  style={
                    isMobile
                      ? {
                          width: "100%",
                          justifyContent: "flex-start",
                          textAlign: "left",
                          padding: "12px 14px",
                        }
                      : undefined
                  }
                >
                  <span className="workflow-step-label">
                    {step.label}
                  </span>

                  <span className="workflow-step-status">
                    {step.complete ? "Completed" : "Pending"}
                  </span>
                </button>

                {/* <span className="workflow-step-needs">
                  {step.complete
                    ? ""
                    : (() => {
                        const text = `Needs: ${step.missingFields.join(
                          ", "
                        )}`;

                        return (
                          text.slice(0, 40) +
                          (text.length > 40 ? "..." : "")
                        );
                      })()}
                </span> */}
              </div>

              {index < steps.length - 1 && !isMobile && (
                <div className="workflow-arrow-container">
                  <span className="workflow-arrow" aria-hidden="true">
                    →
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="workflow-progress-section">
        <div className="workflow-progress-text">
          <span>
            {completedCount} of {steps.length} steps completed
          </span>
          <span>{progressValue}%</span>
        </div>

        <div className="workflow-progress-bar-track">
          <div
            className="workflow-progress-bar-fill"
            style={{ "--progress-width": `${progressValue}%` }}
          />
          <div className="workflow-progress-bar-remaining" />
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;
