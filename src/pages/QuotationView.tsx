import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Download, Save, Loader2 } from "lucide-react";
import { formatNepaliNumber } from "@/lib/formatters";
import { LoadingScreen } from "@/components/LoadingScreen";

interface Quotation {
  id: string;
  project_id: string;
  quotation_number: string;
  quotation_date: string;
  validity_days: number;
  grand_total: number;
  created_at: string;
}

interface BOQProject {
  id: string;
  project_name: string;
  client_name: string | null;
  site_location: string | null;
  built_up_area: string | null;
  start_date: string | null;
  completion_date: string | null;
  discount_percent?: number | null;
  overhead_percent?: number | null;
  vat_percent?: number | null;
  transportation_cost?: number | null;
  custom_title?: string | null;
}

const QuotationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<BOQProject | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState("");
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split("T")[0]);
  const [validityDays, setValidityDays] = useState("30");
  const [busy, setBusy] = useState(false);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [formData, setFormData] = useState<import("@/components/BOQForm").BOQFormData | null>(null);

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const { data: projectDataRaw, error: projectError } = await supabase
        .from("boq_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projectError || !projectDataRaw) {
        toast.error("Project not found");
        navigate("/");
        return;
      }

      const projectData = projectDataRaw as unknown as BOQProject;
      setProject(projectData);

      const { data: quotationDataRaw } = await supabase
        .from("quotations" as any)
        .select("*")
        .eq("project_id", id)
        .single();

      const quotationData = quotationDataRaw as unknown as Quotation | null;

      if (quotationData) {
        setQuotation(quotationData);
        setQuotationNumber(quotationData.quotation_number);
        setQuotationDate(quotationData.quotation_date);
        setValidityDays(String(quotationData.validity_days));
      }

      // Fetch all work items for this project to prepare PDF data
      const fetchWorkItems = (table: string) =>
        supabase.from(table as any).select("*").eq("project_id", id);

      if (!quotationData) {
        // Auto-generate next quotation number: BQT-YYYYXX
        // Auto-increment logic
        const year = new Date().getFullYear();
        const prefix = `BQT-${year}`;

        const { data: latestQuoteDataRaw, error: quoteError } = await supabase
          .from("quotations")
          .select("quotation_number")
          .ilike("quotation_number", `${prefix}%`)
          .order("quotation_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (quoteError) {
          console.error("Error fetching latest quotation:", quoteError);
        }

        const latestQuoteData = latestQuoteDataRaw as unknown as { quotation_number: string } | null;

        let nextNum = "01";
        if (latestQuoteData && latestQuoteData.quotation_number) {
          const currentNum = parseInt(latestQuoteData.quotation_number.slice(-2));
          if (!isNaN(currentNum)) {
            nextNum = String(currentNum + 1).padStart(2, "0");
          }
        }


        setQuotationNumber(`${prefix}${nextNum}`);
      }

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

      const toFormItems = (response: { data: any[] | null } | null) => {
        return Array.isArray(response?.data) ? response!.data.map((i) => ({
          itemName: i.item_name,
          specification: i.specification || "",
          unit: i.unit,
          quantity: Number(i.quantity) || 0,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
          remarks: i.remarks || "",
        })) : [];
      };

      const preparedFormData: import("@/components/BOQForm").BOQFormData = {
        projectInfo: {
          projectName: projectData.project_name,
          clientName: projectData.client_name,
          siteLocation: projectData.site_location,
          builtUpArea: projectData.built_up_area,
          startDate: projectData.start_date,
          completionDate: projectData.completion_date,
        },
        additionalCosts: {
          discount_percent: projectData.discount_percent || 0,
          overhead_percent: projectData.overhead_percent || 0,
          vat_percent: projectData.vat_percent || 0,
          transportation_cost: projectData.transportation_cost || 0,
          custom_title: projectData.custom_title || "",
        },
        civilMetalWork: toFormItems(civilMetal),
        civilPCCWork: toFormItems(civilPCC),
        civilOtherWork: toFormItems(civilOther),
        panelFloorWork: toFormItems(panelFloor),
        panelRoofWork: toFormItems(panelRoof),
        panelWallWork: toFormItems(panelWall),
        upvcDoorsWindows: toFormItems(upvc),
        toiletBathPlumbing: toFormItems(toilet),
        wallPuttyWork: toFormItems(putty),
        electricWork: toFormItems(electric),
        roofingWork: toFormItems(roofing),
        ecoPanelOtherWork: toFormItems(ecoOther),
        customFieldWork: toFormItems(customField),
      };
      setFormData(preparedFormData);

    } catch (error) {
      console.error("Error loading quotation:", error);
      toast.error("Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  const calculateGrandTotal = () => {
    if (!formData) return 0;
    const sum = (arr?: any[]) => (arr || []).reduce((s, i) => s + (Number(i?.amount) || 0), 0);
    const subtotal = sum(formData.civilMetalWork) + sum(formData.civilPCCWork) + sum(formData.civilOtherWork) +
      sum(formData.panelFloorWork) + sum(formData.panelRoofWork) + sum(formData.panelWallWork) +
      sum(formData.upvcDoorsWindows) + sum(formData.toiletBathPlumbing) + sum(formData.wallPuttyWork) +
      sum(formData.electricWork) + sum(formData.roofingWork) + sum(formData.ecoPanelOtherWork) +
      sum(formData.customFieldWork);

    const ac = formData.additionalCosts as any;
    const discountPercent = ac?.discount_percent || 0;
    const overheadPercent = ac?.overhead_percent || 0;
    const vatPercent = ac?.vat_percent || 0;
    const transportationCost = ac?.transportation_cost || 0;

    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const overheadAmount = (afterDiscount * overheadPercent) / 100;
    const beforeVAT = afterDiscount + overheadAmount + (transportationCost || 0);
    const vatAmount = (beforeVAT * vatPercent) / 100;
    return beforeVAT + vatAmount;
  };

  const handleSaveQuotation = async () => {
    if (!quotationNumber.trim()) {
      toast.error("Please enter a quotation number");
      return;
    }

    try {
      setBusy(true);
      const grandTotal = calculateGrandTotal();

      if (quotation) {
        // Update existing
        const { data: updatedQuoteRaw, error } = await supabase
          .from("quotations" as any)
          .update({
            quotation_number: quotationNumber,
            quotation_date: quotationDate,
            validity_days: parseInt(validityDays),
            grand_total: grandTotal,
          })
          .eq("id", quotation.id)
          .select();

        if (error) throw error;
        // Cast the array result to get the single item
        const updatedQuote = (updatedQuoteRaw as any[])?.[0] as Quotation;
        toast.success("Quotation updated successfully!");
        setQuotation(updatedQuote);
      } else {
        // Create new
        const { data: newQuoteRaw, error } = await supabase
          .from("quotations" as any)
          .insert({
            project_id: id,
            quotation_number: quotationNumber,
            quotation_date: quotationDate,
            validity_days: parseInt(validityDays),
            grand_total: grandTotal,
          })
          .select()
          .single();

        if (error) throw error;
        const newQuote = newQuoteRaw as unknown as Quotation;
        setQuotation(newQuote);
        toast.success("Quotation created successfully!");
      }

      setEditMode(false);
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast.error("Failed to save quotation");
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadQuotationPDF = async () => {
    if (!formData || !project) {
      toast.error("Data not loaded yet");
      return;
    }
    try {
      setBusy(true);
      // Use the dedicated quotation generator
      const { generateQuotationPdfFromFormData } = await import("@/lib/quotationPdf");

      const quoteData = {
        quotationNumber: quotationNumber || "DRAFT",
        quotationDate: quotationDate,
        validityDays: Number(validityDays),
        recipientName: project.client_name || "Valued Client",
        recipientAddress: project.site_location || "Nepal",
        fobTerms: "WareHouse",
        deliveryNumber: "-",
        inquiryDate: "",
      };

      await generateQuotationPdfFromFormData(formData, quoteData);
      toast.success("Quotation PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading quotation:", error);
      toast.error("Failed to download quotation");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!project) return null;

  const validityEndDate = new Date(quotationDate);
  validityEndDate.setDate(validityEndDate.getDate() + parseInt(validityDays));
  const currentGrandTotal = calculateGrandTotal() || quotation?.grand_total || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {editMode ? "Edit Quotation" : "Quotation Details"}
            </h1>
          </div>
        </div>
        {/* Main Card */}
        <Card className="p-8 mb-6 bg-white shadow-lg">
          {/* Quotation Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-[#1E2D4D] mb-2">Project Name</h3>
                <p className="text-gray-700">{project.project_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#1E2D4D] mb-2">Client Name</h3>
                <p className="text-gray-700">{project.client_name || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#1E2D4D] mb-2">Site Location</h3>
                <p className="text-gray-700">{project.site_location || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Quotation Details */}
          {editMode ? (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block font-medium text-[#1E2D4D] mb-2">Quotation Number</label>
                <Input
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  placeholder="e.g., QT-2024-001"
                  className="border-[#EF7E1E]/30 focus:ring-[#EF7E1E]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#1E2D4D] mb-2">Quotation Date</label>
                <Input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="border-[#EF7E1E]/30 focus:ring-[#EF7E1E]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#1E2D4D] mb-2">Validity (Days)</label>
                <Input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  className="border-[#EF7E1E]/30 focus:ring-[#EF7E1E]"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-[#FFF5EB] rounded-lg">
              <div>
                <h3 className="font-semibold text-[#1E2D4D] mb-2">Quotation Number</h3>
                <p className="text-gray-700">{quotationNumber || "Not set"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#1E2D4D] mb-2">Quotation Date</h3>
                <p className="text-gray-700">{quotationDate}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#1E2D4D] mb-2">Validity</h3>
                <p className="text-gray-700">{validityDays} days (till {validityEndDate.toLocaleDateString()})</p>
              </div>
            </div>
          )}

          {/* Summary Info */}
          <div className="bg-gradient-to-r from-[#1E2D4D] to-[#2a3f66] text-white p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold opacity-75 mb-1">Grand Total</p>
                <p className="text-4xl font-bold">NRS {formatNepaliNumber(currentGrandTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75">Including VAT & Additional Costs</p>
              </div>
            </div>
          </div>

          {/* Professional Terms */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-[#1E2D4D] mb-3">Terms & Conditions</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• This quotation is valid for {validityDays} days from the date issued above.</li>
              <li>• All prices are in Nepali Rupees and subject to change without notice.</li>
              <li>• Payment terms as per agreement with BELA NEPAL INDUSTRIES PVT. LTD.</li>
              <li>• Warranty: 2 Yrs Maintenance with material and wage due to construction and material defect.</li>
              <li>• For any queries, contact: 01-5922974 | 057-591888</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <Button
              onClick={() => setEditMode(!editMode)}
              className="bg-[#1E2D4D] hover:bg-[#1E2D4D]/90 text-white"
            >
              {editMode ? "Cancel" : "Edit Quotation"}
            </Button>

            <div className="flex gap-3">
              {editMode && (
                <Button
                  onClick={handleSaveQuotation}
                  disabled={busy}
                  className="bg-[#1E2D4D] hover:bg-[#1E2D4D]/90 text-white"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Quotation
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleDownloadQuotationPDF}
                disabled={busy || !quotationNumber}
                className="bg-[#EF7E1E] hover:bg-[#EF7E1E]/90 text-white"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Quotation PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuotationView;
