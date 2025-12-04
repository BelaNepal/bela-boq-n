import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface PanelRoofWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
  projectId?: string;
}

const PanelRoofWorkForm = ({ data, onChange, projectId }: PanelRoofWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Panel Roof Work Items" category="panel_roof_work" projectId={projectId} />;
};

export default PanelRoofWorkForm;
