import { Link, useNavigate } from "react-router-dom";
import { clearAuthToken, getAuthUser } from "../auth";

function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    clearAuthToken();
    navigate("/login");
  };

  const user = getAuthUser();

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h1>Solar Project Manager</h1>
        <p>Welcome, {user?.name || "User"}</p>
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