import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface CivilMetalWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
}

const CivilMetalWorkForm = ({ data, onChange }: CivilMetalWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Metal Work Items" category="civil_metal_work" />;
};

export default CivilMetalWorkForm;
