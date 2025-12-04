import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface AdditionalCostsData {
  discount_percent?: number;
  overhead_percent?: number;
  vat_percent?: number;
  transportation_cost?: number;
  custom_title?: string;
}

interface Props {
  formData: AdditionalCostsData;
  setFormData: (d: AdditionalCostsData) => void;
}

const AdditionalCostsForm: React.FC<Props> = ({ formData, setFormData }) => {
  const onNumChange = (key: keyof AdditionalCostsData, value: string) => {
    const num = value === "" ? undefined : parseFloat(value);
    setFormData({ ...formData, [key]: num });
  };

  return (
    <div className="mt-6 p-4 border rounded-md bg-surface">
      <h3 className="text-lg font-semibold mb-3">Additional Costs & Taxes</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount (%)</Label>
          <Input
            type="number"
            value={formData.discount_percent ?? ""}
            onChange={(e) => onNumChange("discount_percent", e.target.value)}
            placeholder="e.g. 5"
          />
        </div>

        <div className="space-y-2">
          <Label>Overhead (%)</Label>
          <Input
            type="number"
            value={formData.overhead_percent ?? ""}
            onChange={(e) => onNumChange("overhead_percent", e.target.value)}
            placeholder="e.g. 10"
          />
        </div>

        <div className="space-y-2">
          <Label>VAT (%)</Label>
          <Input
            type="number"
            value={formData.vat_percent ?? ""}
            onChange={(e) => onNumChange("vat_percent", e.target.value)}
            placeholder="e.g. 13"
          />
        </div>

        <div className="space-y-2">
          <Label>Transportation Cost</Label>
          <Input
            type="number"
            value={formData.transportation_cost ?? ""}
            onChange={(e) => onNumChange("transportation_cost", e.target.value)}
            placeholder="e.g. 2000"
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Custom Title</Label>
          <Input
            value={formData.custom_title ?? ""}
            onChange={(e) => setFormData({ ...formData, custom_title: e.target.value })}
            placeholder="Optional custom title"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalCostsForm;