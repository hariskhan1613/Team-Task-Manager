import { Bell, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, socket } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const loadInvitations = async () => {
    try {
      const { data } = await api.get("/invitations");
      setInvitations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResponse = async (id, action) => {
    try {
      await api.patch(`/invitations/${id}/respond`, { action });
      await loadInvitations();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to process invitation");
    }
  };

  useEffect(() => {
    loadInvitations();

    const onVisibilityChange = () => {
      if (!document.hidden) {
        loadInvitations();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", loadInvitations);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", loadInvitations);
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const refreshInvites = () => loadInvitations();
    socket.on("invitations:update", refreshInvites);
    return () => {
      socket.off("invitations:update", refreshInvites);
    };
  }, [socket]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-primary">
          Team Task Manager
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setOpen((prev) => !prev);
                loadInvitations();
              }}
              className="relative rounded-lg border border-slate-200 p-2 text-secondary transition hover:bg-slate-50"
            >
              <Bell size={18} />
              {invitations.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                  {invitations.length}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
                <p className="mb-3 text-sm font-semibold text-primary">Invitations</p>
                {invitations.length === 0 ? (
                  <p className="text-sm text-secondary">No pending invitations.</p>
                ) : (
                  <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
                    {invitations.map((invite) => (
                      <div key={invite._id} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-medium text-primary">
                          {invite.sender.name} invited you
                        </p>
                        <p className="text-xs text-secondary">
                          Project: {invite.projectId?.name}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleResponse(invite._id, "accepted")}
                            className="button-accent flex-1"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResponse(invite._id, "rejected")}
                            className="button-secondary flex-1"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-primary">{user?.name}</p>
            <p className="text-xs text-secondary">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-200 p-2 text-secondary transition hover:bg-slate-50"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
