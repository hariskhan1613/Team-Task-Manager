import { Link } from "react-router-dom";

const ProjectCard = ({ project }) => (
  <div className="card flex flex-col gap-4">
    <div>
      <h3 className="text-lg font-semibold">{project.name}</h3>
      <p className="mt-1 text-sm text-secondary">
        Role: <span className="font-medium text-primary">{project.role}</span>
      </p>
      <p className="mt-1 text-sm text-secondary">
        Team Size: {project.members.length + 1}
      </p>
    </div>
    <Link to={`/projects/${project._id}`} className="button-secondary text-center">
      Open Project
    </Link>
  </div>
);

export default ProjectCard;
