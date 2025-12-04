import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface PanelWallWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
  projectId?: string;
}

const PanelWallWorkForm = ({ data, onChange, projectId }: PanelWallWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Panel Wall Work Items" category="panel_wall_work" projectId={projectId} />;
};

export default PanelWallWorkForm;
