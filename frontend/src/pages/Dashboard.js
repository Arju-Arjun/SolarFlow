import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; 
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
  // 💡 NEW: PWA PUSH NOTIFICATION PERMISSION & SUBSCRIPTION LOGIC
  // ==========================================================================
  useEffect(() => {
    if (!user) return;

    const configurePushSubscription = async () => {
      try {
        // 1. Verify if Service Workers and Push Notification subsystems are natively supported
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.warn("Push messaging infrastructure is not supported in this client environment.");
          return;
        }

        // 2. Wait until the service worker lifecycle transitions to active/ready baseline
        const registration = await navigator.serviceWorker.ready;

        // 3. Inspect if an established push pipeline channel exists on this client context
        let subscription = await registration.pushManager.getSubscription();

        // 4. Request notification permissions from user if not granted yet
        if (!subscription && Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          
          if (permission === "granted") {
            const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

            if (!VAPID_PUBLIC_KEY) {
              console.error("[PWA Push] Missing REACT_APP_VAPID_PUBLIC_KEY environment variable.");
              return;
            }

            let convertedKey;
            try {
              convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            } catch (conversionError) {
              console.error("[PWA Push] Invalid VAPID public key format:", conversionError);
              return;
            }

            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey
            });

            // 5. Structure the key arrays into raw strings safe for database mapping
            const rawSubscriptionPayload = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("p256dh")))),
                auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("auth"))))
              }
            };

            // 6. Transmit structural network registration data packet to Flask backend schema channels
            await notificationAPI.saveSubscription(rawSubscriptionPayload);
            console.log("[PWA Push] Device subscription payload synchronized with system backend.");
          }
        }
      } catch (err) {
        console.error("[PWA Push] Failed to establish structural background sync pipeline:", err);
      }
    };

    configurePushSubscription();
  }, [user]);

  // Utility helper to safely convert application server string keys to Uint8Array sequences
  const urlBase64ToUint8Array = (base64String) => {
    if (!base64String || typeof base64String !== "string") {
      throw new Error("VAPID public key must be a non-empty string.");
    }

    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

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
    e.stopPropagation(); 
    try {
      await notificationAPI.deleteAlert(alertId);
      setNotificationsList(prev => prev.filter(item => item.id !== alertId));
    } catch (err) {
      console.error("Failed to delete notification item:", err);
    }
  };

  // ==========================================================================
  // REDIRECT USER TO CUSTOMER PROFILE ON ITEM CLICK
  // ==========================================================================
  const handleNotificationClick = (customerId) => {
    setShowNotifications(false); 
    navigate(`/customer/${customerId}`); 
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