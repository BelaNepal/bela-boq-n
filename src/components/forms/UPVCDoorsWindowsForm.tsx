import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface UPVCDoorsWindowsFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
}

const UPVCDoorsWindowsForm = ({ data, onChange }: UPVCDoorsWindowsFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="UPVC Doors & Windows Items" category="upvc_doors_windows" />;
};

export default UPVCDoorsWindowsForm;
