import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    navigate(`/meet/${code.trim()}`);
  };

  return (
    <div className="flex justify-center py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center mb-2">
          Join a meeting
        </h1>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Enter meeting code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            placeholder="e.g. X7Q9M2"
          />
        </div>
        <button className="w-full py-2 rounded-lg bg-brand hover:bg-brand-dark text-sm font-medium">
          Join
        </button>
      </form>
    </div>
  );
}
