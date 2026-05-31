import { Link, useNavigate } from "react-router-dom";
import { clearAuthToken, getAuthUser } from "../auth";
import { useCallback, useState } from "react";
import usePolling from "../hooks/usePolling";
import { customersAPI } from "../api";

function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    clearAuthToken();
    navigate("/login");
  };

  const user = getAuthUser();
  const [customerCount, setCustomerCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await customersAPI.list();
      setCustomerCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch (err) {
      // ignore errors here; keep existing count
      console.debug("Failed to fetch customer count", err?.message || err);
    }
  }, []);

  // Poll customer count every 10 seconds
  usePolling(fetchCount, 10000);

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h1>Solar Project Manager</h1>
        <p>Welcome, {user?.name || "User"}</p>
        <p style={{ marginTop: 6, fontSize: 14, color: '#374151' }}>{customerCount} customers</p>
      </div>

      <div className="grid-two">

        <Link className="card-link" to="/customers/add">
          <h3>Add Customer</h3>
          <p>Add new customer details and capacity.</p>
        </Link>

        <Link className="card-link" to="/customers">
          <h3>View Customers</h3>
          <p>Review customer list and manage details.</p>
        </Link>

      </div>

      <div className="dashboard-logout">
        <button onClick={logout}>
          Logout
        </button>
      </div>

    </div>
  );
}

export default Dashboard;