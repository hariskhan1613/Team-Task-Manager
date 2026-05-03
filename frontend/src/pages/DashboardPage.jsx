import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import ProjectCard from "../components/ProjectCard";

const MetricCard = ({ label, value }) => (
  <div className="card">
    <p className="text-sm text-secondary">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);

const DashboardPage = () => {
  const { socket } = useAuth();
  const [projects, setProjects] = useState([]);
  const [memberDashboard, setMemberDashboard] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  const adminProjects = useMemo(
    () => projects.filter((project) => project.role === "Admin"),
    [projects]
  );

  const loadData = async (options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
    try {
      const [{ data: projectsData }, { data: memberData }] = await Promise.all([
        api.get("/projects/my"),
        api.get("/dashboard/member")
      ]);
      setProjects(projectsData);
      setMemberDashboard(memberData);

      const firstAdminProject = projectsData.find((project) => project.role === "Admin");
      const defaultProjectId = selectedProjectId || firstAdminProject?._id || "";
      setSelectedProjectId(defaultProjectId);

      if (defaultProjectId) {
        const { data } = await api.get(`/dashboard/admin/${defaultProjectId}`);
        setAdminDashboard(data);
      } else {
        setAdminDashboard(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load dashboard.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    const onVisibilityChange = () => {
      if (!document.hidden) {
        loadData({ silent: true });
      }
    };
    const onFocus = () => loadData({ silent: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const refreshDashboard = () => loadData({ silent: true });
    socket.on("projects:update", refreshDashboard);
    socket.on("dashboard:update", refreshDashboard);
    return () => {
      socket.off("projects:update", refreshDashboard);
      socket.off("dashboard:update", refreshDashboard);
    };
  }, [socket, selectedProjectId]);

  const createProject = async (event) => {
    event.preventDefault();
    if (!projectName.trim()) return;

    try {
      const { data } = await api.post("/projects", { name: projectName.trim() });
      const nextProject = {
        ...data,
        role: "Admin",
        members: data.members || []
      };
      setProjects((prev) => [nextProject, ...prev]);
      if (!selectedProjectId) {
        setSelectedProjectId(data._id);
        const { data: adminData } = await api.get(`/dashboard/admin/${data._id}`);
        setAdminDashboard(adminData);
      }
      setProjectName("");
      await loadData({ silent: true });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create project.");
    }
  };

  const loadAdminProjectDashboard = async (event) => {
    const value = event.target.value;
    setSelectedProjectId(value);
    if (!value) {
      setAdminDashboard(null);
      return;
    }
    try {
      const { data } = await api.get(`/dashboard/admin/${value}`);
      setAdminDashboard(data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load admin stats.");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-8">
        <p className="text-secondary">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-5 py-8">
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <p className="mt-1 text-sm text-secondary">
            Project creator is automatically project admin.
          </p>
          <form onSubmit={createProject} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              className="input"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
            <button type="submit" className="button-primary whitespace-nowrap">
              Create Project
            </button>
          </form>
        </div>
        <MetricCard label="Total Projects" value={projects.length} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">My Projects</h2>
        {projects.length === 0 ? (
          <div className="card text-secondary">No projects yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Member Dashboard</h2>
          {memberDashboard ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="My Total Tasks" value={memberDashboard.totalTasks} />
              <MetricCard label="Todo" value={memberDashboard.todoTasks} />
              <MetricCard label="In Progress" value={memberDashboard.inProgressTasks} />
              <MetricCard label="Done" value={memberDashboard.doneTasks} />
              <MetricCard label="Overdue" value={memberDashboard.overdueTasks} />
            </div>
          ) : (
            <div className="card text-secondary">No member data.</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
            <select
              className="input max-w-64"
              value={selectedProjectId}
              onChange={loadAdminProjectDashboard}
            >
              <option value="">Select project</option>
              {adminProjects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {!adminDashboard ? (
            <div className="card text-secondary">
              Create or select a project where you are admin.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="Total Tasks" value={adminDashboard.totalTasks} />
              <MetricCard label="Overdue Tasks" value={adminDashboard.overdueTasks} />
              <MetricCard label="Completion Rate" value={`${adminDashboard.completionRate}%`} />
              <div className="card sm:col-span-2">
                <p className="text-sm text-secondary">Tasks Per User</p>
                <div className="mt-3 space-y-2">
                  {adminDashboard.tasksPerUser.map((item) => (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-sm text-secondary">
                        {item.done}/{item.total} done
                      </p>
                    </div>
                  ))}
                  {adminDashboard.tasksPerUser.length === 0 && (
                    <p className="text-sm text-secondary">No tasks assigned yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;
