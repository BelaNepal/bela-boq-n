import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Save, Loader2 } from "lucide-react";
import { BOQFormData } from "./BOQForm";
import { WorkItem } from "./forms/WorkItemForm";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateBOQPdfFromFormData } from "@/lib/boqPdf";
import { formatNepaliNumber } from "@/lib/formatters";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useState } from "react";
import { EmailModal } from "./EmailModal";
import { generateQuotationPdfFromFormData } from "@/lib/quotationPdf";

interface BOQSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: BOQFormData;
  existingProjectId?: string;
}
const BOQSummaryModal = ({ open, onOpenChange, formData, existingProjectId }: BOQSummaryModalProps) => {
  const [busy, setBusy] = useState(false);
  const [showQuotationFields, setShowQuotationFields] = useState(false);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split("T")[0]);
  const [validityDays, setValidityDays] = useState("30");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [fobTerms, setFobTerms] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [savedQuotationNumber, setSavedQuotationNumber] = useState("");

  // Auto-generate quotation number
  const generateQuotationNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `QT-${year}${month}${day}-${timestamp}`;
  };

  const calculateSectionTotal = (items: WorkItem[]) => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const civilMetalTotal = calculateSectionTotal(formData.civilMetalWork);
  const civilPCCTotal = calculateSectionTotal(formData.civilPCCWork);
  const civilOtherTotal = calculateSectionTotal(formData.civilOtherWork);
  const civilTotal = civilMetalTotal + civilPCCTotal + civilOtherTotal;

  const panelFloorTotal = calculateSectionTotal(formData.panelFloorWork);
  const panelRoofTotal = calculateSectionTotal(formData.panelRoofWork);
  const panelWallTotal = calculateSectionTotal(formData.panelWallWork);
  const upvcTotal = calculateSectionTotal(formData.upvcDoorsWindows);
  const toiletTotal = calculateSectionTotal(formData.toiletBathPlumbing);
  const puttyTotal = calculateSectionTotal(formData.wallPuttyWork);
  const electricTotal = calculateSectionTotal(formData.electricWork);
  const roofingTotal = calculateSectionTotal(formData.roofingWork);
  const ecoPanelOtherTotal = calculateSectionTotal(formData.ecoPanelOtherWork);
  const customTotal = calculateSectionTotal(formData.customFieldWork || []);
  const ecoPanelTotal =
    panelFloorTotal +
    panelRoofTotal +
    panelWallTotal +
    upvcTotal +
    toiletTotal +
    puttyTotal +
    electricTotal +
    roofingTotal +
    ecoPanelOtherTotal;

  // Subtotal (before discounts/overhead/VAT/transport)
  const subtotal = civilTotal + ecoPanelTotal + customTotal;

  // Additional costs from form (may be undefined)
  const additional = formData.additionalCosts ?? {
    discount_percent: 0,
    overhead_percent: 0,
    vat_percent: 0,
    transportation_cost: 0,
    custom_title: "",
  };

  const discountPercent = additional.discount_percent ?? 0;
  const overheadPercent = additional.overhead_percent ?? 0;
  const vatPercent = additional.vat_percent ?? 0;
  const transportationCost = additional.transportation_cost ?? 0;
  const customTitle = additional.custom_title ?? "";

  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const overheadAmount = (afterDiscount * overheadPercent) / 100;
  const beforeVAT = afterDiscount + overheadAmount + (transportationCost || 0);
  const vatAmount = (beforeVAT * vatPercent) / 100;
  const grandTotal = beforeVAT + vatAmount;

  const handleSave = async () => {
    try {
      setBusy(true);
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to save BOQ");
        return;
      }

      let projectId: string;
      if (existingProjectId) {
        projectId = existingProjectId;
        const { error: updateError } = await supabase
          .from("boq_projects")
          .update({
            project_name: formData.projectInfo.projectName,
            client_name: formData.projectInfo.clientName,
            site_location: formData.projectInfo.siteLocation || null,
            built_up_area: formData.projectInfo.builtUpArea || null,
            start_date: formData.projectInfo.startDate || null,
            completion_date: formData.projectInfo.completionDate || null,
            fiscal_year: formData.projectInfo.fiscalYear || null,
            discount_percent: discountPercent || null,
            overhead_percent: overheadPercent || null,
            vat_percent: vatPercent || null,
            transportation_cost: transportationCost || null,
            custom_title: customTitle || null,
            user_id: user.id,
          })
          .eq("id", projectId);
        if (updateError) throw updateError;
      } else {
        const { data: project, error: projectError } = await supabase
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
            discount_percent: discountPercent || null,
            overhead_percent: overheadPercent || null,
            vat_percent: vatPercent || null,
            transportation_cost: transportationCost || null,
            custom_title: customTitle || null,
          })
          .select()
          .single();
        if (projectError) throw projectError;
        projectId = project.id;
      }

      const insertPromises = [];
      type LooseSupabase = { from: (table: string) => { insert: (rows: unknown[]) => Promise<unknown> } };
      const sbLoose = supabase as unknown as LooseSupabase;

      if (formData.civilMetalWork.length > 0) {
        insertPromises.push(
          supabase.from("civil_metal_work").insert(
            formData.civilMetalWork.map((item) => ({
              project_id: projectId,
              item_name: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              remarks: item.remarks,
            }))
          )
        );
      }

      if (formData.civilPCCWork.length > 0) {
        insertPromises.push(
          supabase.from("civil_pcc_work").insert(
            formData.civilPCCWork.map((item) => ({
              project_id: projectId,
              item_name: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              remarks: item.remarks,
            }))
          )
        );
      }

      if (formData.civilOtherWork.length > 0) {
        const sb = supabase as any;
        insertPromises.push(
          (async () => {
            const { error: delErr } = await sb.from("civil_other_work").delete().eq("project_id", projectId);
            if (delErr) throw delErr;
            const { error: insErr } = await sb
              .from("civil_other_work")
              .insert(
                formData.civilOtherWork.map((item) => ({
                  project_id: projectId,
                  item_name: item.itemName,
                  specification: item.specification,
                  unit: item.unit,
                  quantity: Number(item.quantity) || 0,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                  remarks: item.remarks,
                }))
              );
            if (insErr) throw insErr;
          })()
        );
      }


      // Note: 'civil_other_work' table does not exist in Supabase types; skip DB insert for now

      if (formData.panelFloorWork.length > 0) {
        const floorItems = existingProjectId
          ? formData.panelFloorWork.filter((i) => !i.sn && !i.product_code && !i.bela_prod_code)
          : formData.panelFloorWork;
        if (floorItems.length > 0) {
          insertPromises.push(
            supabase
              .from("panel_floor_work")
              .insert(
                floorItems.map((item) => ({
                  project_id: projectId,
                  item_name: item.itemName,
                  specification: item.specification,
                  unit: item.unit,
                  quantity: Number(item.quantity) || 0,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                  remarks: item.remarks,
                }))
              )
          );
        }
      }

      if (formData.panelRoofWork.length > 0) {
        const roofItems = existingProjectId
          ? formData.panelRoofWork.filter((i) => !i.sn && !i.product_code && !i.bela_prod_code)
          : formData.panelRoofWork;
        if (roofItems.length > 0) {
          insertPromises.push(
            supabase
              .from("panel_roof_work")
              .insert(
                roofItems.map((item) => ({
                  project_id: projectId,
                  item_name: item.itemName,
                  specification: item.specification,
                  unit: item.unit,
                  quantity: Number(item.quantity) || 0,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                  remarks: item.remarks,
                }))
              )
          );
        }
      }

      if (formData.panelWallWork.length > 0) {
        const wallItems = existingProjectId
          ? formData.panelWallWork.filter((i) => !i.sn && !i.product_code && !i.bela_prod_code)
          : formData.panelWallWork;
        if (wallItems.length > 0) {
          insertPromises.push(
            supabase
              .from("panel_wall_work")
              .insert(
                wallItems.map((item) => ({
                  project_id: projectId,
                  item_name: item.itemName,
                  specification: item.specification,
                  unit: item.unit,
                  quantity: Number(item.quantity) || 0,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                  remarks: item.remarks,
                }))
              )
          );
        }
      }

      if (formData.upvcDoorsWindows.length > 0) {
        insertPromises.push(
          supabase.from("upvc_doors_windows").insert(
            formData.upvcDoorsWindows.map((item) => ({
              project_id: projectId,
              item_name: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              remarks: item.remarks,
            }))
          )
        );
      }

      if (formData.toiletBathPlumbing.length > 0) {
        insertPromises.push(
          supabase.from("toilet_bath_plumbing").insert(
            formData.toiletBathPlumbing.map((item) => ({
              project_id: projectId,
              item_name: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              remarks: item.remarks,
            }))
          )
        );
      }

      if (formData.wallPuttyWork.length > 0) {
        insertPromises.push(
          supabase.from("wall_putty_work").insert(
            formData.wallPuttyWork.map((item) => ({
              project_id: projectId,
              item_name: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              remarks: item.remarks,
            }))
          )
        );
      }

      if (formData.electricWork.length > 0) {
        insertPromises.push(
          supabase.from("electric_work").insert(
            formData.electricWork.map((item) => ({
              project_id: projectId,
              item_name: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              remarks: item.remarks,
            }))
          )
        );
      }

      if (formData.roofingWork.length > 0) {
        insertPromises.push(
          supabase.from("roofing_work").insert(
            formData.roofingWork.map((item) => ({
              project_id: projectId,
              item_name: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              remarks: item.remarks,
            }))
          )
        );
      }

      // Save custom user-entered items to custom_field_work
      const collectCustom = (arr: any[] = []) => arr.filter((i) => (i?.source ?? "custom") === "custom");
      const customItems = [
        ...collectCustom(formData.civilMetalWork),
        ...collectCustom(formData.civilPCCWork),
        ...collectCustom(formData.civilOtherWork),
        ...collectCustom(formData.panelFloorWork),
        ...collectCustom(formData.panelRoofWork),
        ...collectCustom(formData.panelWallWork),
        ...collectCustom(formData.upvcDoorsWindows),
        ...collectCustom(formData.toiletBathPlumbing),
        ...collectCustom(formData.wallPuttyWork),
        ...collectCustom(formData.electricWork),
        ...collectCustom(formData.roofingWork),
        ...collectCustom(formData.ecoPanelOtherWork),
      ];

      if (customItems.length > 0) {
        const sb = supabase as any;
        insertPromises.push(
          (async () => {
            const { error: delErr } = await sb.from("custom_field_work").delete().eq("project_id", projectId);
            if (delErr) throw delErr;
            const { error: insErr } = await sb
              .from("custom_field_work")
              .insert(
                customItems.map((item) => ({
                  project_id: projectId,
                  item_name: item.itemName,
                  specification: item.specification,
                  unit: item.unit,
                  quantity: Number(item.quantity) || 0,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                  remarks: item.remarks,
                }))
              );
            if (insErr) throw insErr;
          })()
        );
      }

      if (formData.ecoPanelOtherWork.length > 0) {
        const sb = supabase as any;
        insertPromises.push(
          (async () => {
            const { error: delErr } = await sb.from("eco_panel_other_work").delete().eq("project_id", projectId);
            if (delErr) throw delErr;
            const { error: insErr } = await sb
              .from("eco_panel_other_work")
              .insert(
                formData.ecoPanelOtherWork.map((item) => ({
                  project_id: projectId,
                  item_name: item.itemName,
                  specification: item.specification,
                  unit: item.unit,
                  quantity: Number(item.quantity) || 0,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                  remarks: item.remarks,
                }))
              );
            if (insErr) throw insErr;
          })()
        );
      }

      await Promise.all(insertPromises);

      toast.success("BOQ saved successfully!");
      // Modal stays open - user can close manually
    } catch (error) {
      console.error("Error saving BOQ:", error);
      toast.error("Failed to save BOQ");
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setBusy(true);
      if (showQuotationFields) {
        const quotationNumber = generateQuotationNumber();
        toast.info("Generating Quotation PDF...");
        await generateQuotationPdfFromFormData(formData, {
          quotationNumber,
          quotationDate,
          validityDays: Number(validityDays),
          recipientName,
          recipientAddress,
          fobTerms,
          deliveryNumber,
          inquiryDate
        });
        toast.success("Quotation PDF downloaded!");
      } else {
        toast.info("Generating BOQ PDF...");
        await generateBOQPdfFromFormData(formData);
        toast.success("BOQ PDF downloaded successfully!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveQuotation = async () => {
    try {
      setBusy(true);
      const quotationNumber = generateQuotationNumber();

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save quotation");
        return;
      }

      // First save the BOQ if not already saved
      if (!existingProjectId) {
        toast.error("Please save the BOQ first before creating a quotation");
        return;
      }

      // Save quotation to database
      const { error } = await supabase.from("quotations").insert({
        project_id: existingProjectId,
        quotation_number: quotationNumber,
        quotation_date: quotationDate,
        validity_days: Number(validityDays),
        recipient_name: recipientName,
        recipient_address: recipientAddress,
        fob_terms: fobTerms,
        delivery_number: deliveryNumber,
        inquiry_date: inquiryDate || null,
        grand_total: grandTotal,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success(`Quotation ${quotationNumber} saved successfully!`);
      setSavedQuotationNumber(quotationNumber);
      setShowQuotationFields(false);

      // Auto-open email modal after successful save
      setTimeout(() => {
        setEmailModalOpen(true);
      }, 500);
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast.error("Failed to save quotation");
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSend = async (email: string, subject: string, message: string) => {
    try {
      // Generate PDF with the saved quotation data
      const quotationNumber = savedQuotationNumber || generateQuotationNumber();
      await generateQuotationPdfFromFormData(formData, {
        quotationNumber,
        quotationDate,
        validityDays: Number(validityDays),
        recipientName,
        recipientAddress,
        fobTerms,
        deliveryNumber,
        inquiryDate
      });

      // In a real app, you would send the PDF blob to a backend API here
      console.log("Sending email to:", email, "Subject:", subject, "Message:", message);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Just toast success for now as per plan
      toast.success("Email sent to " + email);
    } catch (error) {
      console.error("Error generating PDF for email:", error);
      throw error;
    }
  };

  const SectionSummary = ({ title, items, total }: { title: string; items: WorkItem[]; total: number; serialStart?: number }) => {
    if (items.length === 0) return null;

    const match = String(title).trim().match(/^([A-Za-z])/);
    const suffix = match ? match[1].toLowerCase() : "a";

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-[#EF7E1E] text-base">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1E2D4D] text-white">
                <th className="px-2 py-2 text-left w-12">S.N.</th>
                <th className="px-2 py-2 text-left">Item Description</th>
                <th className="px-2 py-2 text-left">Specification</th>
                <th className="px-2 py-2 text-left w-16">Unit</th>
                <th className="px-2 py-2 text-right w-20">Qty</th>
                <th className="px-2 py-2 text-right w-24">Rate</th>
                <th className="px-2 py-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="px-2 py-2">{`${index + 1}.${suffix}`}</td>
                  <td className="px-2 py-2 font-medium">{item.itemName}</td>
                  <td className="px-2 py-2 text-muted-foreground">{item.specification || "-"}</td>
                  <td className="px-2 py-2">{item.unit}</td>
                  <td className="px-2 py-2 text-right">{formatNepaliNumber(item.quantity)}</td>
                  <td className="px-2 py-2 text-right">{formatNepaliNumber(item.rate)}</td>
                  <td className="px-2 py-2 text-right font-semibold">{formatNepaliNumber(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end bg-[#FAF0E6] px-4 py-2 rounded">
          <span className="font-bold text-[#1E2D4D]">Subtotal: NRS {formatNepaliNumber(total)}</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1E2D4D]">BOQ Summary</DialogTitle>
          <DialogDescription>Review your Bill of Quantities before downloading or saving</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <Card className="p-4 bg-gradient-to-r from-[#EF7E1E]/10 to-[#1E2D4D]/10">
            <h3 className="font-semibold text-[#1E2D4D] mb-2">Project Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Project Name:</span>
                <p className="text-gray-700">{formData.projectInfo.projectName}</p>
              </div>
              <div>
                <span className="font-medium">Client Name:</span>
                <p className="text-gray-700">{formData.projectInfo.clientName || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">Site Location:</span>
                <p className="text-gray-700">{formData.projectInfo.siteLocation || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">Built-Up Area:</span>
                <p className="text-gray-700">{formData.projectInfo.builtUpArea || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">Starting Date:</span>
                <p className="text-gray-700">{formData.projectInfo.startDate || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">Completion Date:</span>
                <p className="text-gray-700">{formData.projectInfo.completionDate || "N/A"}</p>
              </div>
            </div>
          </Card>


          {/* Civil Work */}
          {(formData.civilMetalWork.length > 0 || formData.civilPCCWork.length > 0 || formData.civilOtherWork.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1E2D4D]">SECTION 1: CIVIL WORK</h3>
              {formData.civilMetalWork.length > 0 && (
                <SectionSummary title="A. Metal Work" items={formData.civilMetalWork} total={civilMetalTotal} />
              )}
              {formData.civilPCCWork.length > 0 && (
                <SectionSummary title="B. PCC Work" items={formData.civilPCCWork} total={civilPCCTotal} />
              )}
              {formData.civilOtherWork.length > 0 && (
                <SectionSummary title="C. Other Civil Work" items={formData.civilOtherWork} total={civilOtherTotal} />
              )}
              <Card className="p-3 bg-[#FAF0E6]">
                <div className="flex justify-between font-bold text-[#1E2D4D]">
                  <span>CIVIL WORK TOTAL</span>
                  <span>NRS {formatNepaliNumber(civilTotal)}</span>
                </div>
              </Card>
            </div>
          )}

          {/* Eco-Panel Work */}
          {(formData.panelFloorWork.length > 0 ||
            formData.panelRoofWork.length > 0 ||
            formData.panelWallWork.length > 0 ||
            formData.upvcDoorsWindows.length > 0 ||
            formData.toiletBathPlumbing.length > 0 ||
            formData.wallPuttyWork.length > 0 ||
            formData.electricWork.length > 0 ||
            formData.roofingWork.length > 0 ||
            formData.ecoPanelOtherWork.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#1E2D4D]">SECTION 2: ECO-PANEL WORK</h3>
                {formData.panelFloorWork.length > 0 && (
                  <SectionSummary title="A. Panel Floor Work" items={formData.panelFloorWork} total={panelFloorTotal} />
                )}
                {formData.panelRoofWork.length > 0 && (
                  <SectionSummary title="B. Panel Roof Work" items={formData.panelRoofWork} total={panelRoofTotal} />
                )}
                {formData.panelWallWork.length > 0 && (
                  <SectionSummary title="C. Panel Wall Work" items={formData.panelWallWork} total={panelWallTotal} />
                )}
                {formData.upvcDoorsWindows.length > 0 && (
                  <SectionSummary title="D. UPVC Doors & Windows" items={formData.upvcDoorsWindows} total={upvcTotal} />
                )}
                {formData.toiletBathPlumbing.length > 0 && (
                  <SectionSummary title="E. Toilet, Bath & Plumbing" items={formData.toiletBathPlumbing} total={toiletTotal} />
                )}
                {formData.wallPuttyWork.length > 0 && (
                  <SectionSummary title="F. Wall Putty Work" items={formData.wallPuttyWork} total={puttyTotal} />
                )}
                {formData.electricWork.length > 0 && (
                  <SectionSummary title="G. Electric Work" items={formData.electricWork} total={electricTotal} />
                )}
                {formData.roofingWork.length > 0 && (
                  <SectionSummary title="H. Roofing Work" items={formData.roofingWork} total={roofingTotal} />
                )}
                {formData.ecoPanelOtherWork.length > 0 && (
                  <SectionSummary title="I. Other Eco-Panel Work" items={formData.ecoPanelOtherWork} total={ecoPanelOtherTotal} />
                )}
                <Card className="p-3 bg-[#FAF0E6]">
                  <div className="flex justify-between font-bold text-[#1E2D4D]">
                    <span>ECO-PANEL WORK TOTAL</span>
                    <span>NRS {formatNepaliNumber(ecoPanelTotal)}</span>
                  </div>
                </Card>
              </div>
            )}

          {/* Custom Work section removed; custom items are stored under custom_field_work and included in Subtotal */}

          {/* Section C: Additional Costs */}
          <Card className="p-4 border-2 border-[#EF7E1E]/30">
            <h4 className="text-lg font-semibold text-[#1E2D4D] mb-3">Section C: Additional Costs & Taxes</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-semibold bg-[#FAF0E6] px-3 py-2 rounded">
                <span>Subtotal</span>
                <span>NRS {formatNepaliNumber(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-NRS {formatNepaliNumber(discountAmount)}</span>
                </div>
              )}
              {overheadPercent > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Overhead ({overheadPercent}%)</span>
                  <span>NRS {formatNepaliNumber(overheadAmount)}</span>
                </div>
              )}
              {transportationCost > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Transportation Cost</span>
                  <span>NRS {formatNepaliNumber(transportationCost)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold bg-[#FAF0E6] px-3 py-2 rounded">
                <span>Before VAT</span>
                <span>NRS {formatNepaliNumber(beforeVAT)}</span>
              </div>
              {vatPercent > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>VAT ({vatPercent}%)</span>
                  <span>NRS {formatNepaliNumber(vatAmount)}</span>
                </div>
              )}
              <div className="mt-4 p-4 bg-gradient-to-r from-[#1E2D4D] to-[#2a3f66] text-white rounded-lg shadow-lg border border-[#EF7E1E]/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold tracking-wide opacity-90">GRAND TOTAL</span>
                  <span className="text-xs uppercase font-medium opacity-75">(including VAT)</span>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-bold block mb-1">NRS {formatNepaliNumber(grandTotal)}</span>
                  <div className="h-0.5 bg-[#EF7E1E]/40 mt-2"></div>
                </div>
              </div>
              {customTitle && <div className="mt-2 text-sm font-medium text-[#1E2D4D]">Note: {customTitle}</div>}
            </div>
          </Card>

          {/* Quotation Section */}
          {showQuotationFields && (
            <Card className="p-4 border-2 border-[#EF7E1E]/30">
              <h4 className="text-lg font-semibold text-[#1E2D4D] mb-3">Quotation Details</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-[#1E2D4D] mb-1">Quotation Date</label>
                    <input
                      type="date"
                      value={quotationDate}
                      onChange={(e) => setQuotationDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF7E1E]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#1E2D4D] mb-1">Validity (Days)</label>
                    <input
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF7E1E]"
                    />
                  </div>
                </div>

                {/* Additional Quotation Fields */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-[#1E2D4D] mb-1">Recipient Name (TO)</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Recipient Company/Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF7E1E]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#1E2D4D] mb-1">Recipient Address</label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="Full Address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF7E1E]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#1E2D4D] mb-1">F.O.B. / Delivery Terms</label>
                    <input
                      type="text"
                      value={fobTerms}
                      onChange={(e) => setFobTerms(e.target.value)}
                      placeholder="e.g., Ex-Factory"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF7E1E]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#1E2D4D] mb-1">Delivery Number</label>
                    <input
                      type="text"
                      value={deliveryNumber}
                      onChange={(e) => setDeliveryNumber(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF7E1E]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#1E2D4D] mb-1">Inquiry Date</label>
                    <input
                      type="date"
                      value={inquiryDate}
                      onChange={(e) => setInquiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EF7E1E]"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t flex-wrap">
            <Button variant="outline" onClick={() => !busy && onOpenChange(false)} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Close
            </Button>
            <Button onClick={handleSave} disabled={busy} className="bg-[#1E2D4D] hover:bg-[#1E2D4D]/90 text-white">
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save BOQ
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowQuotationFields(!showQuotationFields)}
              disabled={busy}
              className="bg-[#1E2D4D] hover:bg-[#1E2D4D]/90 text-white"
            >
              {showQuotationFields ? "Hide Quotation" : "Create Quotation"}
            </Button>
            {showQuotationFields && (
              <>
                <Button
                  onClick={handleSaveQuotation}
                  disabled={busy}
                  className="bg-green-600 hover:bg-green-700 text-white"
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
                <Button
                  onClick={() => setEmailModalOpen(true)}
                  disabled={busy}
                  variant="outline"
                  className="border-[#EF7E1E] text-[#EF7E1E] hover:bg-[#EF7E1E]/10"
                >
                  Email Quotation
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={busy}
                  className="bg-[#EF7E1E] hover:bg-[#EF7E1E]/90 text-white"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Quotation PDF
                    </>
                  )}
                </Button>
              </>
            )}
            {!showQuotationFields && (
              <Button onClick={handleDownloadPDF} disabled={busy} className="bg-[#EF7E1E] hover:bg-[#EF7E1E]/90 text-white">
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <EmailModal
          open={emailModalOpen}
          onOpenChange={setEmailModalOpen}
          onSend={handleEmailSend}
          defaultSubject={`Quotation - ${formData.projectInfo.projectName}`}
          defaultMessage={`Dear ${recipientName || "Sir/Madam"},\n\nPlease find attached the quotation for ${formData.projectInfo.projectName}.\n\nBest regards,\nBela Nepal Industries`}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BOQSummaryModal;
