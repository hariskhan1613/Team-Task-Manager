const styles = {
  Todo: "bg-slate-100 text-slate-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Done: "bg-emerald-100 text-emerald-700"
};

const TaskStatusBadge = ({ status }) => (
  <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
    {status}
  </span>
);

export default TaskStatusBadge;
