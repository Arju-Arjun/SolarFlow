import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: ""
  });

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // Timer effect window counter
  useEffect(() => {
    let interval;
    if (otpSent && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && otpSent) {
      setOtpSent(false);
      setOtp(new Array(6).fill(""));
      setError("OTP expired. Please fill details and try again.");
    }
    return () => clearInterval(interval);
  }, [otpSent, timeLeft]);

  // Step 1: Handle registration parameters details verification
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (formData.mobile.length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 💡 Calling step 1 route to dispatch otp code token mapping
      await api.post("/auth/register/request-otp", formData);
      setOtpSent(true);
      setTimeLeft(300); // 5 minutes standard lifetime window
      setMessage("Verification code sent to your email inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Finalize entry processing loop sequence
  const handleFinalOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please complete the 6-digit confirmation code.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register/verify-otp", {
        ...formData,
        otp: fullOtp
      });

      setMessage("Registration successful! Redirecting to login terminal...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or incorrect OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Register</h2>

        {/* 💡 Condition: Show regular fields when OTP is not sent yet */}
        {!otpSent ? (
          <form onSubmit={handleDetailsSubmit}>
            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required disabled={loading} />

            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label>Mobile</label>
            <input
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Sending Code..." : "Register & Send OTP"}
            </button>
          </form>
        ) : (
          /* 💡 Condition: Show ONLY OTP field configuration after submission */
          <form onSubmit={handleFinalOtpSubmit}>
            <p className="info-text" style={{ marginBottom: "15px", color: "#555" }}>
              We have sent a 6-digit confirmation key to <strong>{formData.email}</strong>.
            </p>

            <div className="verification-timer" style={{ marginBottom: "15px" }}>
              <span style={{ color: "#666" }}>Code active for: </span>
              <strong style={{ color: "#d9534f" }}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </strong>
            </div>

            <label style={{ fontWeight: "bold" }}>Enter 6-Digit OTP</label>
            <div className="otp-container" style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "15px 0" }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  style={{
                    width: "40px",
                    height: "40px",
                    textAlign: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold"
                  }}
                />
              ))}
            </div>

            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Verifying Token..." : "Confirm & Create Account"}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              disabled={loading}
              style={{
                marginTop: "15px",
                background: "none",
                border: "none",
                color: "#777",
                cursor: "pointer",
                textDecoration: "underline",
                display: "block",
                width: "100%"
              }}
            >
              ← Back to registration parameters
            </button>
          </form>
        )}

        <p style={{ marginTop: "15px" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;