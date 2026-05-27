import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { setAuthToken } from "../auth";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      setAuthToken(response.data.token, response.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          {error && <div className="error">{error}</div>}
          <button type="submit">Login</button>
        </form>
        <p>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
        <p>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
