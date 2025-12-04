    // OtherEcoPanelWorkForm.tsx
    import WorkItemForm, { WorkItem } from "./WorkItemForm";

const OtherEcoPanelWorkForm = ({ data, onChange }: { data: WorkItem[]; onChange: (d: WorkItem[]) => void }) => (
  <WorkItemForm
    data={data}
    onChange={onChange}
    title="Other Eco-Panel Works"
    category="eco_panel_other_work"
  />
);

    export default OtherEcoPanelWorkForm;
