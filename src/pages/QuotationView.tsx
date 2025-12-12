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

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const { data: projectData, error: projectError } = await supabase
        .from("boq_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projectError || !projectData) {
        toast.error("Project not found");
        navigate("/");
        return;
      }

      setProject(projectData);

      const { data: quotationData } = await supabase
        .from("quotations")
        .select("*")
        .eq("project_id", id)
        .single();

      if (quotationData) {
        setQuotation(quotationData);
        setQuotationNumber(quotationData.quotation_number);
        setQuotationDate(quotationData.quotation_date);
        setValidityDays(String(quotationData.validity_days));
      }
    } catch (error) {
      console.error("Error loading quotation:", error);
      toast.error("Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuotation = async () => {
    if (!quotationNumber.trim()) {
      toast.error("Please enter a quotation number");
      return;
    }

    try {
      setBusy(true);
      const grandTotal = 1000000; // This should be calculated from BOQ items

      if (quotation) {
        // Update existing
        const { error } = await supabase
          .from("quotations")
          .update({
            quotation_number: quotationNumber,
            quotation_date: quotationDate,
            validity_days: parseInt(validityDays),
            grand_total: grandTotal,
          })
          .eq("id", quotation.id);

        if (error) throw error;
        toast.success("Quotation updated successfully!");
      } else {
        // Create new
        const { data, error } = await supabase
          .from("quotations")
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
        setQuotation(data);
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
    try {
      setBusy(true);
      // Generate quotation PDF - implement similar to BOQ PDF
      toast.info("Quotation PDF download feature coming soon");
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/boq/${id}`)}
            className="text-[#1E2D4D] hover:text-[#EF7E1E]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BOQ
          </Button>
          <h1 className="text-3xl font-bold text-[#1E2D4D]">Quotation</h1>
          <div className="w-20" />
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
                <p className="text-4xl font-bold">NRS {quotation ? formatNepaliNumber(quotation.grand_total) : "0"}</p>
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
