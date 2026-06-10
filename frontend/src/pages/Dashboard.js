import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate will handle the redirection
import { clearAuthToken, getAuthUser } from "../auth";
import { FaBell, FaTimes } from "react-icons/fa";
import { notificationAPI } from "../api";

function Dashboard() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const bellRef = useRef(null);

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem("spm_token");
    localStorage.removeItem("spm_user");
    navigate("/login");
  };

  const user = getAuthUser();

  // ==========================================================================
  // REAL-TIME POLLING
  // ==========================================================================
  useEffect(() => {
    if (!user) return;
    const fetchActiveAlerts = async () => {
      try {
        const response = await notificationAPI.getUnreadAlerts();
        if (response && response.data) {
          setNotificationsList(response.data);
          const unreadExists = response.data.some(alert => !alert.is_read);
          setHasNewNotifications(unreadExists);
        }
      } catch (error) {
        console.error("Error connecting to notification polling sync:", error);
      }
    };
    fetchActiveAlerts();
    const intervalId = setInterval(fetchActiveAlerts, 5000);
    return () => clearInterval(intervalId);
  }, [user]);

  // ==========================================================================
  // CLOSE DROPDOWN WHEN CLICKING ANYWHERE OUTSIDE
  // ==========================================================================
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleNotifications = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      setHasNewNotifications(false);
      try {
        await notificationAPI.markAsRead();
      } catch (err) {
        console.error("Could not issue read-state confirmation packet:", err);
      }
    }
  };

  // ==========================================================================
  // CLEAR SPECIFIC MESSAGE FROM DB
  // ==========================================================================
  const handleClearAlert = async (e, alertId) => {
    e.stopPropagation(); // Prevents triggers on the parent item click redirect flow
    try {
      await notificationAPI.deleteAlert(alertId);
      setNotificationsList(prev => prev.filter(item => item.id !== alertId));
    } catch (err) {
      console.error("Failed to delete notification item:", err);
    }
  };

  // ==========================================================================
  // 💡 NEW: REDIRECT USER TO CUSTOMER PROFILE ON ITEM CLICK
  // ==========================================================================
  const handleNotificationClick = (customerId) => {
    setShowNotifications(false); // Closes the dropdown panel context
    navigate(`/customer/${customerId}`); // 💡 Fixed path to match http://localhost:3000/customer/3
  };

  return (
    <div className="dashboard-container">

      {/* HEADER SECTION */}
      <div className="dashboard-header">
        <div>
          <h1>Solar Project Manager</h1>
          <p>Welcome, {user?.name ? user.name : "User"}</p>
        </div>

        {/* NOTIFICATION BELL WRAPPER */}
        <div className="notification-bell-wrapper" ref={bellRef} onClick={toggleNotifications}>
          <FaBell className="favbell" size={25} />
          
          {hasNewNotifications && <span className="notification-badge"></span>}
          
          {showNotifications && (
            <div className="notification-dropdown">
              <h4>Notifications</h4>
              {notificationsList.length === 0 ? (
                <p className="empty-text">No new notifications</p>
              ) : (
                notificationsList.map((alert) => (
                  /* 💡 Added onClick mapping and 'clickable-item' style handle */
                  <div 
                    key={alert.id} 
                    className="notification-item clickable-item"
                    onClick={() => handleNotificationClick(alert.customer_id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="notification-content">
                      <h5>{alert.title}</h5>
                      <p>{alert.message}</p>
                    </div>
                    <button 
                      className="clear-alert-btn" 
                      onClick={(e) => handleClearAlert(e, alert.id)}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="grid-two">
        <Link className="card-link" to="/customers/add">
          <h3>Add Customer</h3>
          <p>Add new customer details and capacity.</p>
        </Link>

        <Link className="card-link" to="/customers">
          <h3>View Customers</h3>
          <p>Review customer list and manage details.</p>
        </Link>

        <Link className="card-link" to="/Supplement">
          <h3>Supplement Documents</h3>
          <p>View and download supplement documents.</p>
        </Link>
      </div>

      {/* LOGOUT SECTION */}
      <div className="dashboard-logout">
        <button onClick={logout}>Logout</button>
      </div>

    </div>
  );
}

export default Dashboard;