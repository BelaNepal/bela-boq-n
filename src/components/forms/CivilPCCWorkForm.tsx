import WorkItemForm, { WorkItem } from "./WorkItemForm";

interface CivilPCCWorkFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
}

const CivilPCCWorkForm = ({ data, onChange }: CivilPCCWorkFormProps) => {
  return <WorkItemForm data={data} onChange={onChange} title="PCC Work Items" category="civil_pcc_work" />;
};

export default CivilPCCWorkForm;
