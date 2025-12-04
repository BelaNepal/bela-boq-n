import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface WallPuttyWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
}

const WallPuttyWorkForm = ({ data, onChange }: WallPuttyWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="Wall Putty Work Items" category="wall_putty_work" />;
};

export default WallPuttyWorkForm;
