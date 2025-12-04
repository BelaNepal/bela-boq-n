    // OtherCivilWorkForm.tsx
    import WorkItemForm, { WorkItem } from "./WorkItemForm";

const OtherCivilWorkForm = ({ data, onChange }: { data: WorkItem[]; onChange: (d: WorkItem[]) => void }) => (
  <WorkItemForm
    data={data}
    onChange={onChange}
    title="Other Civil Works"
    category="civil_other_work"
  />
);

    export default OtherCivilWorkForm;
