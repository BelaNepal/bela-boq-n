import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface PanelFloorWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
  projectId?: string;
}

const PanelFloorWorkForm = ({ data, onChange, projectId }: PanelFloorWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Panel Floor Work Items" category="panel_floor_work" projectId={projectId} />;
};

export default PanelFloorWorkForm;
