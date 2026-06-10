import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customersAPI } from "../api";
import WorkflowDiagram from "../components/WorkflowDiagram";
import { FaHome, FaArrowLeft, FaArrowRight } from "react-icons/fa";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [workflowData, setWorkflowData] = useState(null);
  const [workflowError, setWorkflowError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loader = document.getElementById("top-loader");

    if (loader) {
      loader.style.width = "40%";

      setTimeout(() => {
        loader.style.width = "80%";
      }, 300);

      setTimeout(() => {
        loader.style.width = "100%";
      }, 600);

      setTimeout(() => {
        loader.style.width = "0%";
      }, 900);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await customersAPI.list();
        setCustomers(res.data);
      } catch (err) {
        console.log(
          "Error fetching customers:",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCustomerSelect = async (customer) => {
    if (expandedRowId === customer.id) {
      setExpandedRowId(null);
      setWorkflowData(null);
      setWorkflowError("");
      return;
    }

    setExpandedRowId(customer.id);
    setWorkflowError("");

    try {
      const res = await customersAPI.getWorkflow(customer.id);
      setWorkflowData(res.data);
    } catch (err) {
      console.log(
        "Unable to load workflow data for customer:",
        err.response?.data || err.message
      );

      setWorkflowData({ customer });
      setWorkflowError("Workflow details could not be fully loaded.");
    }
  };

  return (
    <div className="customers-page-shell">
      <div className="customer-details-wrapper">
        
        {/* ================= UNIFIED TOP NAVIGATION ACTION ROW ================= */}
        <div 
          className="customers-top-frame-nav" 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            width: "100%", 
            margin: "0 auto 1.5rem auto",
            padding: "0 10px 1rem 10px",
            borderBottom: "1px solid #e2e8f0"
          }}
        >
          <div 
            className="back-btn" 
            onClick={() => navigate(-1)} 
            style={{ cursor: "pointer", fontSize: "1.3rem", color: "#475569", display: "flex", alignItems: "center" }}
            title="Go Back"
          >
            <FaArrowLeft />
          </div>

          <h2 
            className="customers-title" 
            style={{ margin: 0, fontSize: "1.6rem", color: "#1d2636", fontWeight: "700", textAlign: "center", flexGrow: 1 }}
          >
            CUSTOMERS DETAILS
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div 
              className="home-icon" 
              onClick={() => navigate("/dashboard")} 
              style={{ cursor: "pointer", fontSize: "1.5rem", color: "#1466ff", display: "flex", alignItems: "center", position: "static", boxShadow: "none", padding: 0, background: "none" }}
              title="Back to Dashboard"
            >
              <FaHome />
            </div>
            <div 
              className="forward-btn" 
              onClick={() => navigate(1)} 
              style={{ cursor: "pointer", fontSize: "1.3rem", color: "#475569", display: "flex", alignItems: "center" }}
              title="Go Forward"
            >
              <FaArrowRight />
            </div>
          </div>
        </div>

        {/* ================= CUSTOMERS DATA TABLE ================= */}
        <table className="customer-details-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Place</th>
              <th>Capacity</th>
              <th>Created Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              /* 💡 SHOWS LOADING ROW INSIDE THE TABLE BODY */
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexDirection: "column" }}>
                    <div className="profile-spinner" style={{ width: "30px", height: "30px", borderWidth: "3px" }}></div>
                    <span style={{ fontWeight: "500", fontSize: "0.95rem" }}>Loading customer dataset...</span>
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              /* 💡 SHOWS FALLBACK ROW IF THE ARRAY IS EMPTY AND NOT LOADING */
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#888", fontWeight: "500", fontSize: "0.95rem" }}>
                  No customers found
                </td>
              </tr>
            ) : (
              /* SHOWS ACTUAL DATA ROWS IF PRESENT */
              customers.map((c, index) => (
                <React.Fragment key={c.id}>
                  <tr
                    onClick={() => handleCustomerSelect(c)}
                    style={{
                      cursor: "pointer",
                      background: expandedRowId === c.id ? "#f8fafc" : "transparent",
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.place}</td>
                    <td>{c.capacity} KW</td>
                    <td>{c.created_at?.split("T")[0]}</td>

                    <td
                      className={`status-${c.current_status?.toLowerCase()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customer/${c.id}`);
                      }}
                      style={{
                        cursor: "pointer",
                        color: "blue",
                      }}
                    >
                      {c.current_status || "View"}
                    </td>
                  </tr>

                  {/* Dynamic Workflow Diagram Accordion Drawer */}
                  {expandedRowId === c.id && (
                    <tr>
                      <td colSpan="6" style={{ padding: 0, border: "none" }}>
                        <div
                          style={{
                            width: "100%",
                            overflow: "hidden",
                            padding: "12px 0",
                            background: "#f8fafc",
                          }}
                        >
                          <WorkflowDiagram
                            workflowData={workflowData || { customer: c }}
                            customerId={c.id}
                          />

                          {workflowError && (
                            <div
                              style={{
                                marginTop: 12,
                                color: "#dc2626",
                                fontSize: "14px",
                                paddingLeft: "12px",
                              }}
                            >
                              {workflowError}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Customers;