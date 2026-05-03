import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <div className="card w-full">
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <p className="mt-1 text-sm text-secondary">
          Start collaborating with your team.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="text"
            className="input"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
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
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-sm text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignupPage;
