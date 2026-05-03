import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import TaskStatusBadge from "../components/TaskStatusBadge";
import { useAuth } from "../context/AuthContext";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const { user, socket } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    status: "",
    dueDate: "",
    priority: ""
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(
    () => project?.admin?._id === user?.id || project?.admin === user?.id,
    [project, user]
  );

  const refreshProgress = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get(`/projects/${id}/progress`);
      setProgress(data.members);
    } catch (error) {
      console.error(error);
    }
  };

  const loadProjectData = async (options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
    try {
      const [{ data: projectData }, { data: membersData }, { data: tasksData }] =
        await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/members`),
          api.get(`/tasks/project/${id}`)
        ]);

      setProject(projectData);
      setMembers(membersData);
      setTasks(tasksData);

      if (
        projectData.admin?._id === user?.id ||
        projectData.admin?.toString?.() === user?.id
      ) {
        const { data } = await api.get(`/projects/${id}/progress`);
        setProgress(data.members);
      } else {
        setProgress([]);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load project details.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProjectData();
    const onVisibilityChange = () => {
      if (!document.hidden) {
        loadProjectData({ silent: true });
      }
    };
    const onFocus = () => loadProjectData({ silent: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return undefined;

    socket.emit("project:join", id);

    const refreshProject = (payload) => {
      if (!payload?.projectId || payload.projectId === id) {
        loadProjectData({ silent: true });
      }
    };

    socket.on("project:update", refreshProject);

    return () => {
      socket.emit("project:leave", id);
      socket.off("project:update", refreshProject);
    };
  }, [socket, id]);

  const inviteUser = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/projects/${id}/invite`, { email: inviteEmail });
      setInviteEmail("");
      alert("Invitation sent.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send invitation.");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      setMembers((prev) => prev.filter((member) => member._id !== memberId));
      setTaskForm((prev) =>
        prev.assignedTo === memberId ? { ...prev, assignedTo: "" } : prev
      );
      await refreshProgress();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove member.");
    }
  };

  const assignTask = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...taskForm,
        projectId: id,
        status: taskForm.status || "Todo",
        priority: taskForm.priority || "Medium"
      };
      const { data } = await api.post("/tasks", payload);
      setTasks((prev) => [data, ...prev]);
      setTaskForm({
        title: "",
        description: "",
        assignedTo: "",
        status: "",
        dueDate: "",
        priority: ""
      });
      await refreshProgress();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to assign task.");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks((prev) => prev.map((task) => (task._id === taskId ? data : task)));
      await refreshProgress();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update task status.");
    }
  };

  const reassignTask = async (taskId, assignedTo) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/assign`, { assignedTo });
      setTasks((prev) => prev.map((task) => (task._id === taskId ? data : task)));
      await refreshProgress();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reassign task.");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-8">
        <p className="text-secondary">Loading project...</p>
      </main>
    );
  }

  if (!project) return null;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-secondary">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <section className="card">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="mt-1 text-sm text-secondary">
          Role: <span className="font-medium text-primary">{isAdmin ? "Admin" : "Member"}</span>
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Team Members</h2>
          </div>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-primary">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-secondary">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {member.role}
                  </span>
                  {isAdmin && member.role !== "Admin" && (
                    <button
                      type="button"
                      onClick={() => removeMember(member._id)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="card">
            <h3 className="text-base font-semibold">Invite User by Email</h3>
            <form onSubmit={inviteUser} className="mt-3 space-y-3">
              <input
                type="email"
                className="input"
                placeholder="teammate@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <button type="submit" className="button-primary w-full">
                Send Invitation
              </button>
            </form>
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="card">
          <h2 className="text-lg font-semibold">Assign Task</h2>
          <form onSubmit={assignTask} className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              className="input md:col-span-2"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <textarea
              className="input min-h-24 md:col-span-2"
              placeholder="Description"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <select
              className="input"
              value={taskForm.assignedTo}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))
              }
              required
            >
              <option value="">Assign to</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
            <div>
              <select
                className="input"
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, priority: e.target.value }))
                }
              >
                <option value="">Select priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <p className="mt-1 text-xs text-secondary">Choose task importance.</p>
            </div>
            <div>
              <input
                type="date"
                className="input"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
              <p className="mt-1 text-xs text-secondary">Select due date (deadline).</p>
            </div>
            <div>
              <select
                className="input"
                value={taskForm.status}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="">Select status</option>
                <option value="Todo">Assigned</option>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              <p className="mt-1 text-xs text-secondary">Set the starting status.</p>
            </div>
            <button type="submit" className="button-accent md:col-span-2">
              Create Task
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-secondary">
              <tr>
                <th className="px-2 py-2 font-medium">Title</th>
                <th className="px-2 py-2 font-medium">Assignee</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Priority</th>
                <th className="px-2 py-2 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const canUpdate =
                  isAdmin || task.assignedTo?._id === user.id || task.assignedTo === user.id;
                return (
                  <tr key={task._id} className="border-b border-slate-100">
                    <td className="px-2 py-3">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 text-xs text-secondary">{task.description}</p>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-2">
                        <p>{task.assignedTo?.name || "Unknown"}</p>
                        {isAdmin && (
                          <select
                            className="input w-44"
                            value={task.assignedTo?._id || task.assignedTo}
                            onChange={(e) => reassignTask(task._id, e.target.value)}
                          >
                            {members.map((member) => (
                              <option key={member._id} value={member._id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center">
                        {canUpdate ? (
                          <select
                            className="input w-36"
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                          >
                            <option value="Todo">Assigned</option>
                            <option value="Todo">Todo</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                          </select>
                        ) : (
                          <TaskStatusBadge status={task.status} />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-secondary">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                );
              })}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-secondary">
                    No tasks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin && (
        <section className="card">
          <h2 className="text-lg font-semibold">Member Progress</h2>
          <div className="mt-3 space-y-2">
            {progress.map((row) => (
              <div
                key={row.userId}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-secondary">{row.role}</p>
                </div>
                <div className="text-secondary">
                  {row.done}/{row.total} done
                </div>
              </div>
            ))}
            {progress.length === 0 && (
              <p className="text-sm text-secondary">No progress data yet.</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProjectDetailsPage;
