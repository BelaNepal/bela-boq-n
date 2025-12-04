import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface ElectricWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
}

const ElectricWorkForm = ({ data, onChange }: ElectricWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Electric Work Items" category="electric_work" />;
};

export default ElectricWorkForm;
