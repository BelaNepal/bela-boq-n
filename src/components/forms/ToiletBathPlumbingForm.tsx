import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface ToiletBathPlumbingFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
}

const ToiletBathPlumbingForm = ({ data, onChange }: ToiletBathPlumbingFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Toilet, Bath & Plumbing Items" category="toilet_bath_plumbing" />;
};

export default ToiletBathPlumbingForm;
