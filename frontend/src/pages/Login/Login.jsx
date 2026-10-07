import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";

import "./Login.css";

function Login() {
  const { user, login, logout, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoggingIn(true);

    try {
      await login(email.trim(), password);

      // Return to the main website after successful login.
      window.location.href = "/";
    } catch (error) {
      setError(error.message);
    } finally {
      setLoggingIn(false);
    }
  }

  if (loading) {
    return (
      <main className="login-page">
        <div className="login-card">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="login-header">
            <p className="login-eyebrow">T&P | GPREC</p>
            <h1>Already logged in</h1>
            <p>
              You are logged in as <strong>{user.name}</strong>.
            </p>
          </div>

          <div className="login-user">
            <span>{user.email}</span>
            <span className="login-role">{user.role}</span>
          </div>

          <button
            type="button"
            className="login-button"
            onClick={logout}
          >
            Logout
          </button>

          <a href="/" className="login-back">
            <ArrowLeft size={16} />
            Back to website
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="login-eyebrow">T&P | GPREC</p>

          <h1>Staff Login</h1>

          <p>
            Login with your administrator-created account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loggingIn}
          >
            <LogIn size={17} />

            {loggingIn ? "Logging in..." : "Login"}
          </button>
        </form>

        <a href="/" className="login-back">
          <ArrowLeft size={16} />
          Back to website
        </a>
      </div>
    </main>
  );
}

export default Login;
