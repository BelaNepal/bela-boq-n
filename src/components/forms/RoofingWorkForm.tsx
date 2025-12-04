import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface RoofingWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
}

const RoofingWorkForm = ({ data, onChange }: RoofingWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Roofing Work Items" category="roofing_work" />;
};

export default RoofingWorkForm;
