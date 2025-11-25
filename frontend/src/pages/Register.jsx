import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center mb-2">
          Create your account
        </h1>
        {error && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-800 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input
            name="name"
            required
            value={form.name}
            onChange={onChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={onChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Password</label>
          <input
            name="password"
            type="password"
            required
            value={form.password}
            onChange={onChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
        </div>
        <button
          disabled={loading}
          className="w-full py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
        <p className="text-xs text-center text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-light hover:text-brand">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
