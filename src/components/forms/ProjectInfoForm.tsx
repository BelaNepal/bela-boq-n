import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectInfoFormProps {
  data: {
    projectName: string;
    clientName: string;
    siteLocation?: string;
    builtUpArea?: string;
    startDate?: string;
    completionDate?: string;
  };
  onChange: (data: any) => void;
}

const ProjectInfoForm = ({ data, onChange }: ProjectInfoFormProps) => {
  const handleChange = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">Project details</h3>
        <p className="text-sm text-muted-foreground">
          Give your BOQ a clear identity with the project, client and site information.
        </p>
      </div>

      {/* Name row */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="projectName" className="text-sm font-medium">
            Project name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="projectName"
            placeholder="e.g. G+2 Residential Building – Kathmandu"
            value={data.projectName}
            onChange={(e) => handleChange("projectName", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="clientName" className="text-sm font-medium">
            Client name
          </Label>
          <Input
            id="clientName"
            placeholder="Client or organization name"
            value={data.clientName}
            onChange={(e) => handleChange("clientName", e.target.value)}
          />
        </div>
      </div>

      {/* Location & area */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="siteLocation" className="text-sm font-medium">
            Site location
          </Label>
          <Input
            id="siteLocation"
            placeholder="City / municipality, ward, landmark"
            value={data.siteLocation || ""}
            onChange={(e) => handleChange("siteLocation", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="builtUpArea" className="text-sm font-medium">
            Built‑up area
          </Label>
          <Input
            id="builtUpArea"
            placeholder="e.g. 1,250 sq.ft or 116 m²"
            value={data.builtUpArea || ""}
            onChange={(e) => handleChange("builtUpArea", e.target.value)}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-sm font-medium">
            Expected start date
          </Label>
          <Input
            id="startDate"
            type="date"
            value={data.startDate || ""}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="completionDate" className="text-sm font-medium">
            Expected completion date
          </Label>
          <Input
            id="completionDate"
            type="date"
            value={data.completionDate || ""}
            onChange={(e) => handleChange("completionDate", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoForm;
