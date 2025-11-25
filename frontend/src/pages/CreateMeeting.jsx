import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiClient } from "../api/client.js";
import { useNavigate } from "react-router-dom";

export default function CreateMeeting() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const client = apiClient(token);
      const res = await client.post("/meetings", { title });
      navigate(`/meet/${res.data.meeting.code}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center mb-2">
          Start an instant meeting
        </h1>
        {error && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-800 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Meeting title (optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
          />
        </div>
        <button
          disabled={loading}
          className="w-full py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create & join"}
        </button>
      </form>
    </div>
  );
}
