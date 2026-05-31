import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");
    
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
          <button type="submit" disabled={loading} aria-disabled={loading}>
            {loading ? (
              <>
                <span className="loader"></span>
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
        <p>
          Back to <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
