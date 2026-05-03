import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <div className="card w-full">
        <h1 className="text-2xl font-semibold">Welcome Back</h1>
        <p className="mt-1 text-sm text-secondary">
          Login to manage your team tasks.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <button type="submit" className="button-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-secondary">
          No account?{" "}
          <Link to="/signup" className="font-medium text-primary underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
