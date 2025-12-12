import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, FileText, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import ProjectInfoForm from "./forms/ProjectInfoForm";
import { cn } from "@/lib/utils";
import CivilMetalWorkForm from "./forms/CivilMetalWorkForm";
import CivilPCCWorkForm from "./forms/CivilPCCWorkForm";
import PanelFloorWorkForm from "./forms/PanelFloorWorkForm";
import PanelRoofWorkForm from "./forms/PanelRoofWorkForm";
import PanelWallWorkForm from "./forms/PanelWallWorkForm";
import UPVCDoorsWindowsForm from "./forms/UPVCDoorsWindowsForm";
import ToiletBathPlumbingForm from "./forms/ToiletBathPlumbingForm";
import WallPuttyWorkForm from "./forms/WallPuttyWorkForm";
import ElectricWorkForm from "./forms/ElectricWorkForm";
import RoofingWorkForm from "./forms/RoofingWorkForm";
import BOQSummaryModal from "./BOQSummaryModal";
import AdditionalCostsForm, { AdditionalCostsData } from "./forms/AdditionalCostForm";
import OtherCivilWorkForm from "./forms/OtherCivilWorkForm";
import OtherEcoPanelWorkForm from "./forms/OtherEcoPanelWorkForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


export interface BOQFormData {
  projectInfo: {
    projectName: string;
    clientName: string;
    siteLocation?: string;
    builtUpArea?: string;
    startDate?: string;
    completionDate?: string;
    fiscalYear?: string;
  };
  civilMetalWork: any[];
  civilPCCWork: any[];
  panelFloorWork: any[];
  panelRoofWork: any[];
  panelWallWork: any[];
  upvcDoorsWindows: any[];
  toiletBathPlumbing: any[];
  wallPuttyWork: any[];
  electricWork: any[];
  roofingWork: any[];
  additionalCosts?: AdditionalCostsData; // <--- added
  civilOtherWork: any[];
  ecoPanelOtherWork: any[];
  customFieldWork?: any[];
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

const BOQForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<BOQFormData>({
    projectInfo: { projectName: "", clientName: "", siteLocation: "", builtUpArea: "", startDate: "", completionDate: "",},
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
    additionalCosts: undefined, // <--- added
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

  const progress = ((currentStep + 1) / steps.length) * 100;
  const [showStepsChart, setShowStepsChart] = useState(true);
  const lastScroll = useRef<number>(0);
  useEffect(() => {
    // initialize lastScroll on mount
    lastScroll.current = typeof window !== "undefined" ? window.scrollY : 0;
    const threshold = 10;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScroll.current;
      // scroll down -> hide steps chart, scroll up -> show
      if (delta > threshold && showStepsChart) {
        setShowStepsChart(false);
      } else if (delta < -threshold && !showStepsChart) {
        setShowStepsChart(true);
      }
      // always show near top
      if (y < 120 && !showStepsChart) setShowStepsChart(true);
      lastScroll.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showStepsChart]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't navigate when user is typing in inputs, textareas, selects or contenteditable
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active) {
          const tag = (active.tagName || "").toLowerCase();
          const isEditable = active.getAttribute && active.getAttribute("contenteditable") === "true";
          if (tag === "input" || tag === "textarea" || tag === "select" || isEditable) {
            return;
          }
        }
      } catch (err) {
        // ignore DOM access errors and fall back to default behavior
      }

      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentStep]);
  
  const handleNext = async () => {
    if (currentStep === 0 && !formData.projectInfo.projectName) {
      toast.error("Please enter project name");
      return;
    }

    if (currentStep === 0 && !projectId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please login to continue");
          return;
        }
        const { data: project, error } = await supabase
          .from("boq_projects")
          .insert({
            project_name: formData.projectInfo.projectName,
            client_name: formData.projectInfo.clientName,
            user_id: user.id,
            site_location: formData.projectInfo.siteLocation || null,
            built_up_area: formData.projectInfo.builtUpArea || null,
            start_date: formData.projectInfo.startDate || null,
            completion_date: formData.projectInfo.completionDate || null,
            fiscal_year: formData.projectInfo.fiscalYear || null,
          })
          .select()
          .single();
        if (error) throw error;
        setProjectId(project.id);
        toast.success("Project initialized");
      } catch (err) {
        console.error("Failed to initialize project", err);
        toast.error("Failed to initialize project");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // merge additionalCosts into the main payload before showing summary
      setFormData((prev) => ({ ...prev, additionalCosts }));
      setShowSummary(true);
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormDataChange = (stepData: any) => {
    const ActiveComponent = steps[currentStep].component;
    setFormData((prev) => {
      if (ActiveComponent === ProjectInfoForm) {
        return { ...prev, projectInfo: stepData };
      }
      if (ActiveComponent === CivilMetalWorkForm) {
        return { ...prev, civilMetalWork: stepData };
      }
      if (ActiveComponent === CivilPCCWorkForm) {
        return { ...prev, civilPCCWork: stepData };
      }
      if (ActiveComponent === OtherCivilWorkForm) {
        return { ...prev, civilOtherWork: stepData };
      }
      if (ActiveComponent === PanelFloorWorkForm) {
        return { ...prev, panelFloorWork: stepData };
      }
      if (ActiveComponent === PanelRoofWorkForm) {
        return { ...prev, panelRoofWork: stepData };
      }
      if (ActiveComponent === PanelWallWorkForm) {
        return { ...prev, panelWallWork: stepData };
      }
      if (ActiveComponent === UPVCDoorsWindowsForm) {
        return { ...prev, upvcDoorsWindows: stepData };
      }
      if (ActiveComponent === ToiletBathPlumbingForm) {
        return { ...prev, toiletBathPlumbing: stepData };
      }
      if (ActiveComponent === WallPuttyWorkForm) {
        return { ...prev, wallPuttyWork: stepData };
      }
      if (ActiveComponent === ElectricWorkForm) {
        return { ...prev, electricWork: stepData };
      }
      if (ActiveComponent === RoofingWorkForm) {
        return { ...prev, roofingWork: stepData };
      }
      if (ActiveComponent === OtherEcoPanelWorkForm) {
        return { ...prev, ecoPanelOtherWork: stepData };
      }
      return prev;
    });
  };

  const getSectionHeader = () => {
    const step = steps[currentStep];
    if (step.section === "civil") {
      return "Section 1: Civil Work";
    } else if (step.section === "ecopanel") {
      return "Section 2: Eco-Panel Work";
    } else if (step.section === "summary") {
      return "Section 3: Summary";
    }
    return null;
  };
  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  };

  const renderCurrentStep = () => {
    const ActiveComponent = steps[currentStep].component;

    if (ActiveComponent === ProjectInfoForm) {
      return (
        <ProjectInfoForm
          data={formData.projectInfo}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === CivilMetalWorkForm) {
      return (
        <CivilMetalWorkForm
          data={formData.civilMetalWork}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === CivilPCCWorkForm) {
      return (
        <CivilPCCWorkForm
          data={formData.civilPCCWork}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === OtherCivilWorkForm) {
      return (
        <OtherCivilWorkForm
          data={formData.civilOtherWork}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === PanelFloorWorkForm) {
      return (
        <PanelFloorWorkForm
          data={formData.panelFloorWork}
          onChange={handleFormDataChange}
          projectId={projectId}
        />
      );
    }

    if (ActiveComponent === PanelRoofWorkForm) {
      return (
        <PanelRoofWorkForm
          data={formData.panelRoofWork}
          onChange={handleFormDataChange}
          projectId={projectId}
        />
      );
    }

    if (ActiveComponent === PanelWallWorkForm) {
      return (
        <PanelWallWorkForm
          data={formData.panelWallWork}
          onChange={handleFormDataChange}
          projectId={projectId}
        />
      );
    }

    if (ActiveComponent === UPVCDoorsWindowsForm) {
      return (
        <UPVCDoorsWindowsForm
          data={formData.upvcDoorsWindows}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === ToiletBathPlumbingForm) {
      return (
        <ToiletBathPlumbingForm
          data={formData.toiletBathPlumbing}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === WallPuttyWorkForm) {
      return (
        <WallPuttyWorkForm
          data={formData.wallPuttyWork}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === ElectricWorkForm) {
      return (
        <ElectricWorkForm
          data={formData.electricWork}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === RoofingWorkForm) {
      return (
        <RoofingWorkForm
          data={formData.roofingWork}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === OtherEcoPanelWorkForm) {
      return (
        <OtherEcoPanelWorkForm
          data={formData.ecoPanelOtherWork}
          onChange={handleFormDataChange}
        />
      );
    }

    if (ActiveComponent === AdditionalCostsForm) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Step {currentStep + 1} — Additional Costs & Taxes
          </h2>
          <AdditionalCostsForm
            formData={additionalCosts}
            setFormData={setAdditionalCosts}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <>
    
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <img src="/bela-logo.png" alt="Bela" className="h-10 w-auto mx-auto" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              BOQ Generation System
            </h1>
            <p className="text-muted-foreground">Bela Nepal Industries Private Limited</p>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center sticky top-16 z-40 bg-card/80 backdrop-blur-sm px-6 py-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getSectionHeader() && (
                    <Badge variant="secondary">{getSectionHeader()}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">{steps[currentStep].title}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">{Math.round(progress)}% Complete</p>
                <Progress value={progress} className="w-48 md:w-64 h-2.5" />
              </div>
            </div>
            <div className="pt-3">
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 transition-all duration-300 min-h-[56px] ${showStepsChart ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`} aria-hidden={!showStepsChart}>
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-current={index === currentStep ? "step" : undefined}
                          aria-label={`Go to ${step.title}`}
                          onClick={() => { goToStep(index); setShowStepsChart(true); }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-full border px-3 py-1 text-[11px] md:text-xs transition",
                            index === currentStep && "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 ring-2 ring-primary/60",
                            index < currentStep && "bg-muted text-foreground border-muted-foreground/20",
                            index > currentStep && "bg-background text-muted-foreground border-border/60 hover:bg-muted/40"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                              index === currentStep || index < currentStep
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border"
                            )}
                          >
                            {index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
                          </span>
                          <span className="truncate max-w-[9rem]">{step.title}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{step.title}</TooltipContent>
                    </Tooltip>
                    {index !== steps.length - 1 && (
                      <ChevronRight className="hidden h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
              <Separator className="mt-3" />
            </div>
          </Card>

          {/* Form Content */}
          <Card className="p-6">{renderCurrentStep()}</Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Summary
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <BOQSummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
        formData={formData} // now includes additionalCosts
        existingProjectId={projectId}
      />
    </>
  );
};

export default BOQForm;
