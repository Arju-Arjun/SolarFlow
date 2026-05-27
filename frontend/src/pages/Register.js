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

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile validation (only numbers, max 10 digits)
    if (name === "mobile") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (otpSent && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && otpSent) {
      setOtpSent(false);
      setOtp(new Array(6).fill(""));
    }
    return () => clearInterval(interval);
  }, [otpSent, timeLeft]);

  // SEND OTP
  const handleSendOtp = async () => {
    setError("");
    setMessage("");

    if (!formData.email) {
      setError("Enter email first.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/send-otp", { email: formData.email });
      setOtpSent(true);
      setTimeLeft(300); // 5 minutes
      setMessage("OTP sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP INPUT
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

  // REGISTER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // ✅ Mobile validation
    if (formData.mobile.length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    // ✅ Password match check
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // ✅ Password strength check
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!otpSent) {
      setError("Verify email using OTP.");
      return;
    }

    try {
      await api.post("/auth/verify-otp-register", {
        ...formData,
        otp: otp.join("")
      });

      setMessage("Registration successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required />

          <label>Email</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button type="button" onClick={handleSendOtp} disabled={loading || otpSent} style={{marginBottom: "20px"}}>
              {loading ? (
                <span className="spinner-small"></span>
              ) : otpSent ? (
                `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
              ) : (
                "Send OTP"
              )}
            </button>
          </div>

          {otpSent && (
            <div>
              <div className="verification-timer">
                <div className="timer-label">Verification expires in:</div>
                <div className="timer-display">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </div>
              </div>
              <div className="otp-container">
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
                  />
                ))}
              </div>
            </div>
          )}

          <label>Mobile</label>
          <input
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label>Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          <button type="submit">Register</button>
        </form>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;