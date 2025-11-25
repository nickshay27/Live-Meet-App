import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiClient } from "../api/client.js";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { token } = useAuth();
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const client = apiClient(token);
    client
      .get("/meetings")
      .then((res) => setMeetings(res.data.meetings || []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/create"
          className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-4 py-5 text-sm font-medium shadow-lg hover:shadow-xl transition-shadow"
        >
          Start an instant meeting
          <p className="text-xs text-brand-light/80 mt-1">
            Create a room and share the link with your team.
          </p>
        </Link>
        <Link
          to="/join"
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-5 text-sm hover:border-brand/70"
        >
          Join with meeting code
          <p className="text-xs text-slate-400 mt-1">
            Quickly join an ongoing meeting using its code.
          </p>
        </Link>
        <div className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-5 text-sm">
          Upcoming (demo)
          <p className="text-xs text-slate-400 mt-1">
            Scheduling UI can be extended from here.
          </p>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold mb-3">Your recent meetings</h2>
        {meetings.length === 0 ? (
          <p className="text-xs text-slate-400">
            No meetings yet. Create your first instant meeting.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="text-left py-2">Title</th>
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-left py-2"></th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m.id} className="border-b border-slate-900">
                    <td className="py-2 text-sm">{m.title || "Instant meeting"}</td>
                    <td className="py-2 font-mono text-xs">{m.code}</td>
                    <td className="py-2 text-xs text-slate-400">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleString()
                        : ""}
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/meet/${m.code}`}
                        className="text-brand-light hover:text-brand text-xs"
                      >
                        Rejoin
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
