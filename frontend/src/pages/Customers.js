import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customersAPI, workflowAPI } from "../api";
import WorkflowDiagram from "../components/WorkflowDiagram";
import { FaHome } from "react-icons/fa";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [workflowData, setWorkflowData] = useState(null);
  const [workflowError, setWorkflowError] = useState("");

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
        const res = await customersAPI.list();
        setCustomers(res.data);
      } catch (err) {
        console.log(
          "Error fetching customers:",
          err.response?.data || err.message
        );
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
      const res = await workflowAPI.get(customer.id);
      setWorkflowData(res.data);
    } catch (err) {
      console.log(
        "Unable to load workflow data for customer:",
        err.response?.data || err.message
      );

      setWorkflowData({ customer });

      setWorkflowError(
        "Workflow details could not be fully loaded."
      );
    }
  };

  return (
    <div className="customers-page-shell">

      <div className="top-bar">
        <div
          className="home-icon"
          onClick={() => navigate("/dashboard")}
        >
          <FaHome />
        </div>
      </div>

      <h2 className="customers-title">
        Customers Details
      </h2>

      <div className="customer-details-wrapper">
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
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center" }}
                >
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((c, index) => (
                <React.Fragment key={c.id}>
                  <tr
                    onClick={() => handleCustomerSelect(c)}
                    style={{
                      cursor: "pointer",
                      background:
                        expandedRowId === c.id
                          ? "#f8fafc"
                          : "transparent",
                    }}
                  >
                    <td data-label="No">{index + 1}</td>
                    <td data-label="Customer Name">{c.name}</td>
                    <td data-label="Place">{c.place}</td>
                    <td data-label="Capacity">{c.capacity} KW</td>
                    <td data-label="Created Date">
                      {c.created_at?.split("T")[0]}
                    </td>

                    <td
                      data-label="Status"
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

                  {expandedRowId === c.id && (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          padding: 0,
                          border: "none",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            overflow: "hidden",
                            padding: "12px 0",
                            background: "#f8fafc",
                          }}
                        >
                          <WorkflowDiagram
                            workflowData={
                              workflowData || {
                                customer: c,
                              }
                            }
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