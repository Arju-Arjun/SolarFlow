import { useState } from "react";
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

<<<<<<< HEAD
  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile validation (only numbers, max 10 digits)
=======
  const handleChange = (e) => {
    const { name, value } = e.target;

>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
    if (name === "mobile") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setFormData({ ...formData, [name]: value });
  };

<<<<<<< HEAD
  // Timer effect

  // REGISTER
=======
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

<<<<<<< HEAD
    // ✅ Mobile validation
=======
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
    if (formData.mobile.length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

<<<<<<< HEAD
    // ✅ Password match check
=======
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

<<<<<<< HEAD
    // ✅ Password strength check
=======
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

<<<<<<< HEAD
    try {
      await api.post("/auth/register", formData);

      setMessage("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
=======
    setLoading(true);
    try {
      await api.post("/auth/register", formData);
      setMessage("Registration successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
      const fallback = typeof err?.response?.data === "string"
        ? err.response.data
        : err?.message || "Registration failed.";
      setError(serverMessage || fallback);
    } finally {
      setLoading(false);
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
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

<<<<<<< HEAD
          <button type="submit">Register</button>
=======
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
        </form>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;