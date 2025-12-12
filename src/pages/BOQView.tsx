import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import { generateBOQPdfFromFormData } from "@/lib/boqPdf";
import { formatNepaliCurrency } from "@/lib/formatters";
import { numberToWords } from "@/lib/numberToWords";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Loader2 } from "lucide-react";
interface BOQProject {
  id: string;
  project_name: string;
  client_name: string | null;
  created_at: string;
  user_id?: string;
  location?: string | null;
  site_location?: string | null;
  built_up_area?: string | null;
  start_date?: string | null;
  completion_date?: string | null;
  fiscal_year?: string | null;
  discount_percent?: number | null;
  overhead_percent?: number | null;
  vat_percent?: number | null;
  transportation_cost?: number | null;
  custom_title?: string | null;
}

interface WorkItem {
  id: string;
  item_name: string;
  specification: string | null;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks: string | null;
}

const BOQView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [project, setProject] = useState<BOQProject | null>(null);
  const [items, setItems] = useState<{
    civilMetalWork: WorkItem[];
    civilPCCWork: WorkItem[];
    civilOtherWork: WorkItem[];
    panelFloorWork: WorkItem[];
    panelRoofWork: WorkItem[];
    panelWallWork: WorkItem[];
    upvcDoorsWindows: WorkItem[];
    toiletBathPlumbing: WorkItem[];
    wallPuttyWork: WorkItem[];
    electricWork: WorkItem[];
    roofingWork: WorkItem[];
    ecoPanelOtherWork: WorkItem[];
    customFieldWork: WorkItem[];
  }>({
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
    ecoPanelOtherWork: [],
    customFieldWork: [],
  });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchBOQDataWithAccessControl = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please login to view BOQ details");
          navigate("/auth?mode=login");
          return;
        }

        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        const isAdmin = !!roleData;

        const { data: projectData, error: projectError } = await supabase
          .from("boq_projects")
          .select("*")
          .eq("id", id)
          .single();

        if (projectError || !projectData) {
          throw projectError || new Error("BOQ not found");
        }

        // Frontend defense-in-depth: ensure only admins or owners can view
        // RLS on the backend should still be the primary enforcement.
        // ts-expect-error user_id is returned from Supabase but not in the local type
        const projectOwnerId = projectData.user_id as string | undefined;
        if (!isAdmin && projectOwnerId && projectOwnerId !== user.id) {
          setAccessDenied(true);
          toast.error("You do not have permission to view this BOQ");
          return;
        }

        setProject(projectData);

        // Fetch all work items for this project
        const fetchWorkItems = (table: string) =>
          supabase.from(table as never).select("*").eq("project_id", id);

        const [
          civilMetal,
          civilPCC,
          civilOther,
          panelFloor,
          panelRoof,
          panelWall,
          upvc,
          toilet,
          putty,
          electric,
          roofing,
          ecoOther,
          customField,
        ] = await Promise.all([
          fetchWorkItems("civil_metal_work"),
          fetchWorkItems("civil_pcc_work"),
          fetchWorkItems("civil_other_work"),
          fetchWorkItems("panel_floor_work"),
          fetchWorkItems("panel_roof_work"),
          fetchWorkItems("panel_wall_work"),
          fetchWorkItems("upvc_doors_windows"),
          fetchWorkItems("toilet_bath_plumbing"),
          fetchWorkItems("wall_putty_work"),
          fetchWorkItems("electric_work"),
          fetchWorkItems("roofing_work"),
          fetchWorkItems("eco_panel_other_work"),
          fetchWorkItems("custom_field_work"),
        ]);

        const toWorkItems = (response: { data: unknown[] | null } | null): WorkItem[] => {
          return Array.isArray(response?.data) ? (response!.data as WorkItem[]) : [];
        };

        setItems({
          civilMetalWork: toWorkItems(civilMetal),
          civilPCCWork: toWorkItems(civilPCC),
          civilOtherWork: toWorkItems(civilOther),
          panelFloorWork: toWorkItems(panelFloor),
          panelRoofWork: toWorkItems(panelRoof),
          panelWallWork: toWorkItems(panelWall),
          upvcDoorsWindows: toWorkItems(upvc),
          toiletBathPlumbing: toWorkItems(toilet),
          wallPuttyWork: toWorkItems(putty),
          electricWork: toWorkItems(electric),
          roofingWork: toWorkItems(roofing),
          ecoPanelOtherWork: toWorkItems(ecoOther),
          customFieldWork: toWorkItems(customField),
        });
      } catch (error) {
        console.error("Error fetching BOQ:", error);
        toast.error("Failed to load BOQ");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBOQDataWithAccessControl();
    }
  }, [id, navigate]);

  const calculateTotal = (items: WorkItem[]) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const civilTotal =
    calculateTotal(items.civilMetalWork) +
    calculateTotal(items.civilPCCWork) +
    calculateTotal(items.civilOtherWork);
  const ecoPanelTotal =
    calculateTotal(items.panelFloorWork) +
    calculateTotal(items.panelRoofWork) +
    calculateTotal(items.panelWallWork) +
    calculateTotal(items.upvcDoorsWindows) +
    calculateTotal(items.toiletBathPlumbing) +
    calculateTotal(items.wallPuttyWork) +
    calculateTotal(items.electricWork) +
    calculateTotal(items.roofingWork) +
    calculateTotal(items.ecoPanelOtherWork);
  const customTotal = calculateTotal(items.customFieldWork);
  const subtotal = civilTotal + ecoPanelTotal + customTotal;
  const discountPercent = project?.discount_percent || 0;
  const overheadPercent = project?.overhead_percent || 0;
  const vatPercent = project?.vat_percent || 0;
  const transportationCost = project?.transportation_cost || 0;
  const customTitle = project?.custom_title || "";

  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const overheadAmount = (afterDiscount * overheadPercent) / 100;
  const beforeVAT = afterDiscount + overheadAmount + (transportationCost || 0);
  const vatAmount = (beforeVAT * vatPercent) / 100;
  const grandTotal = beforeVAT + vatAmount;

  const handleDownloadPDF = async () => {
    if (!project) return;
    try {
      setIsDownloading(true);
      const toFormItems = (arr: WorkItem[] = []) => arr.map((i) => ({
        itemName: i.item_name,
        specification: i.specification || "",
        unit: i.unit,
        quantity: Number(i.quantity) || 0,
        rate: Number(i.rate) || 0,
        amount: Number(i.amount) || 0,
        remarks: i.remarks || "",
      }));
      const formData: import("@/components/BOQForm").BOQFormData = {
        projectInfo: {
          projectName: project.project_name,
          clientName: project.client_name,
          siteLocation: project.site_location,
          builtUpArea: project.built_up_area,
          startDate: project.start_date,
          completionDate: project.completion_date,
        },
        additionalCosts: {
          discount_percent: project.discount_percent || 0,
          overhead_percent: project.overhead_percent || 0,
          vat_percent: project.vat_percent || 0,
          transportation_cost: project.transportation_cost || 0,
          custom_title: project.custom_title || "",
        },
        civilMetalWork: toFormItems(items.civilMetalWork),
        civilPCCWork: toFormItems(items.civilPCCWork),
        civilOtherWork: toFormItems(items.civilOtherWork),
        panelFloorWork: toFormItems(items.panelFloorWork),
        panelRoofWork: toFormItems(items.panelRoofWork),
        panelWallWork: toFormItems(items.panelWallWork),
        upvcDoorsWindows: toFormItems(items.upvcDoorsWindows),
        toiletBathPlumbing: toFormItems(items.toiletBathPlumbing),
        wallPuttyWork: toFormItems(items.wallPuttyWork),
        electricWork: toFormItems(items.electricWork),
        roofingWork: toFormItems(items.roofingWork),
        ecoPanelOtherWork: toFormItems(items.ecoPanelOtherWork),
        customFieldWork: toFormItems(items.customFieldWork),
      };
      await generateBOQPdfFromFormData(formData);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">You do not have permission to view this BOQ.</p>
          <Button variant="navy" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">BOQ not found</p>
          <Button variant="navy" onClick={() => navigate("/admin")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const ItemTable = ({ title, items, forceShowTitle }: { title: string; items: WorkItem[]; forceShowTitle?: boolean }) => {
    const show = forceShowTitle || items.length > 0;
    if (!show) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-primary text-sm">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th className="px-2 py-1.5 text-left w-[40px]">S.N</th>
                <th className="px-2 py-1.5 text-left">Item</th>
                <th className="px-2 py-1.5 text-left">Specification</th>
                <th className="px-2 py-1.5 text-left w-[60px]">Unit</th>
                <th className="px-2 py-1.5 text-right w-[60px]">Qty</th>
                <th className="px-2 py-1.5 text-right w-[80px]">Rate</th>
                <th className="px-2 py-1.5 text-center w-[100px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="border-b">
                  <td className="px-2 py-1.5 text-center" colSpan={7}>No items</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                    <td className="px-2 py-1.5">{item.item_name}</td>
                    <td className="px-2 py-1.5 text-muted-foreground max-w-[200px] truncate" title={item.specification || ""}>{item.specification || "-"}</td>
                    <td className="px-2 py-1.5">{item.unit}</td>
                    <td className="px-2 py-1.5 text-right">{item.quantity}</td>
                    <td className="px-2 py-1.5 text-right">{formatNepaliCurrency(item.rate)}</td>
                    <td className="px-2 py-1.5 text-center font-medium">{formatNepaliCurrency(item.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-muted font-bold text-secondary">
                  <td colSpan={6} className="px-2 py-1.5 text-right border-t">Subtotal:</td>
                  <td className="px-2 py-1.5 text-center border-t">{formatNepaliCurrency(calculateTotal(items))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.project_name}</h1>
              {project.client_name && (
                <p className="text-muted-foreground">Client: {project.client_name}</p>
              )}
            </div>
          </div>
          <Button variant="navy" onClick={handleDownloadPDF} disabled={isDownloading} className="gap-2">
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>
          <Button
            onClick={() => navigate(`/quotation/${id}`)}
            className="gap-2 bg-[#EF7E1E] hover:bg-[#EF7E1E]/90 text-white"
          >
            <Download className="w-4 h-4" />
            View Quotation
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-secondary">Section 1: Civil Work</h2>
            <ItemTable title="A. Metal Work" items={items.civilMetalWork} />
            <ItemTable title="B. PCC Work" items={items.civilPCCWork} />
            <ItemTable title="C. Other Civil Work" items={items.civilOtherWork} forceShowTitle />
            <div className="flex justify-end bg-secondary/10 px-4 py-2 rounded">
              <span className="font-bold text-secondary">Civil Work Total: {formatNepaliCurrency(civilTotal)}</span>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-secondary">Section 2: Eco-Panel Work</h2>
            <ItemTable title="A. Panel Floor Work" items={items.panelFloorWork} />
            <ItemTable title="B. Panel Roof Work" items={items.panelRoofWork} />
            <ItemTable title="C. Panel Wall Work" items={items.panelWallWork} />
            <ItemTable title="D. UPVC Doors & Windows" items={items.upvcDoorsWindows} />
            <ItemTable title="E. Toilet, Bath & Plumbing" items={items.toiletBathPlumbing} />
            <ItemTable title="F. Wall Putty Work" items={items.wallPuttyWork} />
            <ItemTable title="G. Electric Work" items={items.electricWork} />
            <ItemTable title="H. Roofing Work" items={items.roofingWork} />
            <ItemTable title="I. Other Eco-Panel Work" items={items.ecoPanelOtherWork} forceShowTitle />
            <div className="flex justify-end bg-secondary/10 px-4 py-2 rounded">
              <span className="font-bold text-secondary">Eco-Panel Work Total: {formatNepaliCurrency(ecoPanelTotal)}</span>
            </div>
          </Card>

          {/* Custom Work section removed per requirement; totals still included in Subtotal */}

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-secondary">Section 3: Additional Costs & Taxes</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between bg-secondary/10 px-4 py-2 rounded font-semibold">
                <span>Subtotal</span>
                <span>{formatNepaliCurrency(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatNepaliCurrency(discountAmount)}</span>
                </div>
              )}
              {overheadPercent > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Overhead ({overheadPercent}%)</span>
                  <span>{formatNepaliCurrency(overheadAmount)}</span>
                </div>
              )}
              {transportationCost > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Transportation Cost</span>
                  <span>{formatNepaliCurrency(transportationCost)}</span>
                </div>
              )}
              <div className="flex justify-between bg-secondary/10 px-4 py-2 rounded font-semibold">
                <span>Before VAT</span>
                <span>{formatNepaliCurrency(beforeVAT)}</span>
              </div>
              {vatPercent > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>VAT ({vatPercent}%)</span>
                  <span>{formatNepaliCurrency(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-3 p-3 bg-[#EF7E1E] text-white rounded font-bold text-lg">
                <span>GRAND TOTAL</span>
                <span className="flex flex-col text-right">
                  <span>{formatNepaliCurrency(grandTotal)}</span>
                  <span className="text-xs italic font-normal">(including VAT)</span>
                </span>
              </div>
              {customTitle && (
                <div className="mt-2 text-xs font-medium text-secondary">Note: {customTitle}</div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                In words: {numberToWords(grandTotal)}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BOQView;
