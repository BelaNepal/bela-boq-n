import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Calendar, ArrowLeft, Eye, FileText, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";
import { EmailModal } from "@/components/EmailModal";
import { generateQuotationPdfFromFormData } from "@/lib/quotationPdf";
import { BOQFormData } from "@/components/BOQForm";

interface Quotation {
    id: string;
    quotation_number: string;
    quotation_date: string;
    grand_total: number;
    validity_days: number;
    project_id: string;
    recipient_name: string;
    recipient_address: string;
    fob_terms: string | null;
    delivery_number: string | null;
    inquiry_date: string | null;
    boq_projects: {
        project_name: string;
        client_name: string | null;
    };
}

const AdminQuotations = () => {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

    useEffect(() => {
        fetchQuotations();
    }, []);

    useEffect(() => {
        filterQuotations();
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, quotations]);

    const fetchQuotations = async () => {
        try {
            // Check admin status first (optional double check)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/");
                return;
            }

            // Fetch quotations with project details
            // Fetch quotations with project details
            const { data, error } = await supabase
                .from("quotations" as any)
                .select(`
          *,
          boq_projects (
            project_name,
            client_name
          )
        `)
                .order("quotation_number", { ascending: false });

            if (error) throw error;

            // Cast the data to our known type to resolve lint errors
            const typedData = (data || []) as unknown as Quotation[];
            setQuotations(typedData);
        } catch (error) {
            console.error("Error fetching quotations:", error);
            toast.error("Failed to load quotations");
        } finally {
            setLoading(false);
        }
    };

    const filterQuotations = () => {
        let filtered = [...quotations];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (q) =>
                    q.quotation_number?.toLowerCase().includes(term) ||
                    q.boq_projects?.project_name?.toLowerCase().includes(term) ||
                    q.boq_projects?.client_name?.toLowerCase().includes(term)
            );
        }

        if (startDate) {
            filtered = filtered.filter(
                (q) => new Date(q.quotation_date) >= new Date(startDate)
            );
        }

        if (endDate) {
            filtered = filtered.filter(
                (q) => new Date(q.quotation_date) <= new Date(endDate)
            );
        }

        setFilteredQuotations(filtered);
    };

    const handleEmailQuotation = async (quotation: Quotation) => {
        setSelectedQuotation(quotation);
        setEmailModalOpen(true);
    };

    const handleEmailSend = async (email: string, subject: string, message: string) => {
        if (!selectedQuotation) return;

        try {
            // Fetch the full project data to generate PDF
            const { data: projectData, error: projectError } = await supabase
                .from("boq_projects")
                .select("*")
                .eq("id", selectedQuotation.project_id)
                .single();

            if (projectError) throw projectError;

            // Fetch all work items for the project
            const fetchWorkItems = async (tableName: string) => {
                const { data } = await (supabase as any)
                    .from(tableName)
                    .select("*")
                    .eq("project_id", selectedQuotation.project_id);
                return data || [];
            };

            const [civilMetalWork, civilPCCWork, panelFloorWork, panelRoofWork, panelWallWork,
                upvcDoorsWindows, toiletBathPlumbing, wallPuttyWork, electricWork, roofingWork] = await Promise.all([
                    fetchWorkItems("civil_metal_work"),
                    fetchWorkItems("civil_pcc_work"),
                    fetchWorkItems("panel_floor_work"),
                    fetchWorkItems("panel_roof_work"),
                    fetchWorkItems("panel_wall_work"),
                    fetchWorkItems("upvc_doors_windows"),
                    fetchWorkItems("toilet_bath_plumbing"),
                    fetchWorkItems("wall_putty_work"),
                    fetchWorkItems("electric_work"),
                    fetchWorkItems("roofing_work"),
                ]);

            // Build form data structure
            const formData: BOQFormData = {
                projectInfo: {
                    projectName: projectData.project_name,
                    clientName: projectData.client_name || "",
                    siteLocation: projectData.site_location || "",
                    builtUpArea: projectData.built_up_area || "",
                    startDate: projectData.start_date || "",
                    completionDate: projectData.completion_date || "",
                    fiscalYear: projectData.fiscal_year || "",
                },
                civilMetalWork: civilMetalWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                civilPCCWork: civilPCCWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                civilOtherWork: [],
                panelFloorWork: panelFloorWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                panelRoofWork: panelRoofWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                panelWallWork: panelWallWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                upvcDoorsWindows: upvcDoorsWindows.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                toiletBathPlumbing: toiletBathPlumbing.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                wallPuttyWork: wallPuttyWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                electricWork: electricWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                roofingWork: roofingWork.map((item: any) => ({
                    itemName: item.item_name,
                    specification: item.specification,
                    unit: item.unit,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
                ecoPanelOtherWork: [],
            };

            // Generate PDF
            await generateQuotationPdfFromFormData(formData, {
                quotationNumber: selectedQuotation.quotation_number,
                quotationDate: selectedQuotation.quotation_date,
                validityDays: selectedQuotation.validity_days,
                recipientName: selectedQuotation.recipient_name,
                recipientAddress: selectedQuotation.recipient_address,
                fobTerms: selectedQuotation.fob_terms || "",
                deliveryNumber: selectedQuotation.delivery_number || "",
                inquiryDate: selectedQuotation.inquiry_date || "",
            });

            // Simulate email sending
            console.log("Sending email to:", email, "Subject:", subject, "Message:", message);
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Email sent to " + email);
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    };

    const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
    const paginatedQuotations = filteredQuotations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">All Quotations</h1>
                </div>

                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search No, Project, Client..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                type="date"
                                placeholder="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                type="date"
                                placeholder="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Quotation No</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Grand Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedQuotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No quotations found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedQuotations.map((q) => (
                                        <TableRow key={q.id}>
                                            <TableCell className="font-medium">{q.quotation_number}</TableCell>
                                            <TableCell>{q.quotation_date}</TableCell>
                                            <TableCell>{q.boq_projects?.project_name || "-"}</TableCell>
                                            <TableCell>{q.boq_projects?.client_name || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(q.grand_total)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => navigate(`/quotation/${q.project_id}`)}
                                                        title="View Quotation"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEmailQuotation(q)}
                                                        title="Email Quotation"
                                                        className="text-[#EF7E1E] border-[#EF7E1E] hover:bg-[#EF7E1E]/10"
                                                    >
                                                        <Mail className="w-4 h-4 mr-2" />
                                                        Email
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-end items-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
            <EmailModal
                open={emailModalOpen}
                onOpenChange={setEmailModalOpen}
                onSend={handleEmailSend}
                defaultSubject={selectedQuotation ? `Quotation ${selectedQuotation.quotation_number} - ${selectedQuotation.boq_projects?.project_name}` : ""}
                defaultMessage={selectedQuotation ? `Dear ${selectedQuotation.recipient_name || "Sir/Madam"},\n\nPlease find attached the quotation ${selectedQuotation.quotation_number} for ${selectedQuotation.boq_projects?.project_name}.\n\nBest regards,\nBela Nepal Industries` : ""}
            />
        </div>
    );
};

export default AdminQuotations;
