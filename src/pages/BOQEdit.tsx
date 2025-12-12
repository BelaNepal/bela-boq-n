import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BOQSummaryModal from "@/components/BOQSummaryModal";
import { BOQFormData } from "@/components/BOQForm";
import ProjectInfoForm from "@/components/forms/ProjectInfoForm";
import CivilMetalWorkForm from "@/components/forms/CivilMetalWorkForm";
import CivilPCCWorkForm from "@/components/forms/CivilPCCWorkForm";
import OtherCivilWorkForm from "@/components/forms/OtherCivilWorkForm";
import PanelFloorWorkForm from "@/components/forms/PanelFloorWorkForm";
import PanelRoofWorkForm from "@/components/forms/PanelRoofWorkForm";
import PanelWallWorkForm from "@/components/forms/PanelWallWorkForm";
import UPVCDoorsWindowsForm from "@/components/forms/UPVCDoorsWindowsForm";
import ToiletBathPlumbingForm from "@/components/forms/ToiletBathPlumbingForm";
import WallPuttyWorkForm from "@/components/forms/WallPuttyWorkForm";
import ElectricWorkForm from "@/components/forms/ElectricWorkForm";
import RoofingWorkForm from "@/components/forms/RoofingWorkForm";
import OtherEcoPanelWorkForm from "@/components/forms/OtherEcoPanelWorkForm";
import AdditionalCostsForm, { AdditionalCostsData } from "@/components/forms/AdditionalCostForm";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface WorkItem {
  id?: string;
  itemName: string;
  specification: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks?: string;
}

const steps = [
  { id: 1, title: "Project Information", component: ProjectInfoForm },
  { id: 2, title: "Civil Work - Metal Work", component: CivilMetalWorkForm, section: "civil" },
  { id: 3, title: "Civil Work - PCC Work", component: CivilPCCWorkForm, section: "civil" },
  { id: 4, title: "Civil Work - Other Work", component: OtherCivilWorkForm, section: "civil" },
  { id: 5, title: "Panel Floor Work", component: PanelFloorWorkForm, section: "ecopanel" },
  { id: 6, title: "Panel Roof Work", component: PanelRoofWorkForm, section: "ecopanel" },
  { id: 7, title: "Panel Wall Work", component: PanelWallWorkForm, section: "ecopanel" },
  { id: 8, title: "UPVC Doors & Windows", component: UPVCDoorsWindowsForm, section: "ecopanel" },
  { id: 9, title: "Toilet, Bath & Plumbing", component: ToiletBathPlumbingForm, section: "ecopanel" },
  { id: 10, title: "Wall Putty Work", component: WallPuttyWorkForm, section: "ecopanel" },
  { id: 11, title: "Electric Work", component: ElectricWorkForm, section: "ecopanel" },
  { id: 12, title: "Roofing Work", component: RoofingWorkForm, section: "ecopanel" },
  { id: 13, title: "Eco-Panel Work - Other Work", component: OtherEcoPanelWorkForm, section: "ecopanel" },
  { id: 14, title: "Additional Costs & Taxes", component: AdditionalCostsForm, section: "summary" },
];

const BOQEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [formData, setFormData] = useState<BOQFormData>({
    projectInfo: { projectName: "", clientName: "", siteLocation: "", builtUpArea: "", startDate: "", completionDate: "" },
    civilMetalWork: [],
    civilPCCWork: [],
    civilOtherWork: [],
    panelFloorWork: [],
    panelRoofWork: [],
    panelWallWork: [],
    upvcDoorsWindows: [],
    toiletBathPlumbing: [],
    wallPuttyWork: [],
    electricWork: [],
    roofingWork: [],
    additionalCosts: undefined,
    ecoPanelOtherWork: [],
    customFieldWork: [],
  });

  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostsData>({
    discount_percent: undefined,
    overhead_percent: undefined,
    vat_percent: undefined,
    transportation_cost: undefined,
    custom_title: "",
  });

  const [saving, setSaving] = useState(false);

  // Load existing BOQ data
  useEffect(() => {
    const loadBOQData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please login");
          navigate("/auth?mode=login");
          return;
        }

        // Load project info
        const { data: project, error: projError } = await supabase
          .from("boq_projects")
          .select("*")
          .eq("id", id)
          .single();

        if (projError || !project) {
          toast.error("BOQ not found");
          navigate("/admin");
          return;
        }

        setFormData(prev => ({
          ...prev,
          projectInfo: {
            projectName: project.project_name || "",
            clientName: project.client_name || "",
            siteLocation: project.site_location || "",
            builtUpArea: project.built_up_area || "",
            startDate: project.start_date || "",
            completionDate: project.completion_date || "",
          }
        }));

        setAdditionalCosts({
          discount_percent: project.discount_percent,
          overhead_percent: project.overhead_percent,
          vat_percent: project.vat_percent,
          transportation_cost: project.transportation_cost,
          custom_title: project.custom_title,
        });

        // Load all work items
        const tables = [
          { table: "civil_metal_work", key: "civilMetalWork" },
          { table: "civil_pcc_work", key: "civilPCCWork" },
          { table: "civil_other_work", key: "civilOtherWork" },
          { table: "panel_floor_work", key: "panelFloorWork" },
          { table: "panel_roof_work", key: "panelRoofWork" },
          { table: "panel_wall_work", key: "panelWallWork" },
          { table: "upvc_doors_windows", key: "upvcDoorsWindows" },
          { table: "toilet_bath_plumbing", key: "toiletBathPlumbing" },
          { table: "wall_putty_work", key: "wallPuttyWork" },
          { table: "electric_work", key: "electricWork" },
          { table: "roofing_work", key: "roofingWork" },
          { table: "eco_panel_other_work", key: "ecoPanelOtherWork" },
        ];

        for (const { table, key } of tables) {
          const { data: items } = await supabase
            .from(table)
            .select("*")
            .eq("project_id", id);

          if (items) {
            const converted = items.map((item: any) => ({
              id: item.id,
              itemName: item.item_name,
              specification: item.specification,
              unit: item.unit,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              remarks: item.remarks,
            }));

            setFormData(prev => ({
              ...prev,
              [key]: converted,
            }));
          }
        }
      } catch (error) {
        console.error("Error loading BOQ:", error);
        toast.error("Failed to load BOQ");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBOQData();
    }
  }, [id, navigate]);

  const handleFormDataChange = (stepData: any) => {
    const ActiveComponent = steps[currentStep].component;
    setFormData((prev) => {
      if (ActiveComponent === ProjectInfoForm) {
        return { ...prev, projectInfo: stepData };
      }
      if (ActiveComponent === CivilMetalWorkForm) return { ...prev, civilMetalWork: stepData };
      if (ActiveComponent === CivilPCCWorkForm) return { ...prev, civilPCCWork: stepData };
      if (ActiveComponent === OtherCivilWorkForm) return { ...prev, civilOtherWork: stepData };
      if (ActiveComponent === PanelFloorWorkForm) return { ...prev, panelFloorWork: stepData };
      if (ActiveComponent === PanelRoofWorkForm) return { ...prev, panelRoofWork: stepData };
      if (ActiveComponent === PanelWallWorkForm) return { ...prev, panelWallWork: stepData };
      if (ActiveComponent === UPVCDoorsWindowsForm) return { ...prev, upvcDoorsWindows: stepData };
      if (ActiveComponent === ToiletBathPlumbingForm) return { ...prev, toiletBathPlumbing: stepData };
      if (ActiveComponent === WallPuttyWorkForm) return { ...prev, wallPuttyWork: stepData };
      if (ActiveComponent === ElectricWorkForm) return { ...prev, electricWork: stepData };
      if (ActiveComponent === RoofingWorkForm) return { ...prev, roofingWork: stepData };
      if (ActiveComponent === OtherEcoPanelWorkForm) return { ...prev, ecoPanelOtherWork: stepData };
      return prev;
    });
  };

  const getSectionHeader = () => {
    const step = steps[currentStep];
    if (step.section === "civil") return "Section 1: Civil Work";
    if (step.section === "ecopanel") return "Section 2: Eco-Panel Work";
    if (step.section === "summary") return "Section 3: Summary";
    return null;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleShowSummary();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleShowSummary = () => {
    setFormData((prev) => ({ ...prev, additionalCosts }));
    setShowSummary(true);
  };

  const handleSaveComplete = () => {
    setSaving(false);
    toast.success("BOQ updated successfully!");
    navigate(`/boq/view/${id}`);
  };

  const renderCurrentStep = () => {
    const ActiveComponent = steps[currentStep].component;

    if (ActiveComponent === ProjectInfoForm) {
      return <ProjectInfoForm data={formData.projectInfo} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === CivilMetalWorkForm) {
      return <CivilMetalWorkForm data={formData.civilMetalWork} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === CivilPCCWorkForm) {
      return <CivilPCCWorkForm data={formData.civilPCCWork} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === OtherCivilWorkForm) {
      return <OtherCivilWorkForm data={formData.civilOtherWork} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === PanelFloorWorkForm) {
      return <PanelFloorWorkForm data={formData.panelFloorWork} onChange={handleFormDataChange} projectId={id} />;
    }
    if (ActiveComponent === PanelRoofWorkForm) {
      return <PanelRoofWorkForm data={formData.panelRoofWork} onChange={handleFormDataChange} projectId={id} />;
    }
    if (ActiveComponent === PanelWallWorkForm) {
      return <PanelWallWorkForm data={formData.panelWallWork} onChange={handleFormDataChange} projectId={id} />;
    }
    if (ActiveComponent === UPVCDoorsWindowsForm) {
      return <UPVCDoorsWindowsForm data={formData.upvcDoorsWindows} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === ToiletBathPlumbingForm) {
      return <ToiletBathPlumbingForm data={formData.toiletBathPlumbing} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === WallPuttyWorkForm) {
      return <WallPuttyWorkForm data={formData.wallPuttyWork} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === ElectricWorkForm) {
      return <ElectricWorkForm data={formData.electricWork} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === RoofingWorkForm) {
      return <RoofingWorkForm data={formData.roofingWork} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === OtherEcoPanelWorkForm) {
      return <OtherEcoPanelWorkForm data={formData.ecoPanelOtherWork} onChange={handleFormDataChange} />;
    }
    if (ActiveComponent === AdditionalCostsForm) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Step {currentStep + 1} — Additional Costs & Taxes</h2>
          <AdditionalCostsForm formData={additionalCosts} setFormData={setAdditionalCosts} />
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div className="text-center space-y-2 flex-1">
            <img src="/bela-logo.png" alt="Bela" className="h-10 w-auto mx-auto" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              BOQ Generation System
            </h1>
            <p className="text-muted-foreground">Edit Existing BOQ</p>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-2 h-fit">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center sticky top-16 z-40 bg-card/80 backdrop-blur-sm px-6 py-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getSectionHeader() && <Badge variant="secondary">{getSectionHeader()}</Badge>}
                <span className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{steps[currentStep].title}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">{Math.round(progress)}% Complete</p>
              <Progress value={progress} className="w-48 md:w-64 h-2.5" />
            </div>
          </div>
          <Separator className="mt-3" />
        </Card>

        <Card className="p-6">{renderCurrentStep()}</Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || saving} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button onClick={handleNext} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : currentStep === steps.length - 1 ? (
              "Review & Save"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>

      <BOQSummaryModal open={showSummary} onOpenChange={setShowSummary} formData={formData} existingProjectId={id} onSaveStart={() => setSaving(true)} onSaveComplete={handleSaveComplete} />
    </div>
  );
};

export default BOQEdit;
