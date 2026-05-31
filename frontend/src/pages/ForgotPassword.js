import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval;
    if (emailSent && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && emailSent) {
      setEmailSent(false);
    }
    return () => clearInterval(interval);
  }, [emailSent, timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setStatus(response.data.message);
      setEmailSent(true);
      setTimeLeft(300); // 5 minutes
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <label>Registered Email</label>
          <div>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading || emailSent}
            />
            <button type="submit" disabled={loading || emailSent} style={{marginBottom: "20px"}}>
              {loading ? (
                <>
                  <span className="loader"></span>
                  Sending...
                </>
              ) : emailSent ? (
                `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
              ) : (
                "Send Link"
              )}
            </button>
          </div>
          {error && <div className="error">{error}</div>}
          {status && (
            <div>
              <div className="success">{status}</div>
              {emailSent && (
                <div className="verification-timer">
                  <div className="timer-label">Link expires in:</div>
                  <div className="timer-display">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
        <p>
          Remembered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
