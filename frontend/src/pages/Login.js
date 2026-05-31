import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { isAuthenticated } from "../auth";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // ✅ SAVE TOKEN (for auto-login in PWA)
      localStorage.setItem("spm_token", response.data.token);

      // optional: store user info
      localStorage.setItem(
        "spm_user",
        JSON.stringify(response.data.user)
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />

          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "⏳ Logging in..." : "Login"}
          </button>
        </form>

        <p>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p>
          Don&apos;t have an account?{" "}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;