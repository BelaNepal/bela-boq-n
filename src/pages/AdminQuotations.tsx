import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Calendar, ArrowLeft, Eye, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";

interface Quotation {
    id: string;
    quotation_number: string;
    quotation_date: string;
    grand_total: number;
    validity_days: number;
    project_id: string;
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
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => navigate(`/quotation/${q.project_id}`)}
                                                    title="View Quotation"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
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
        </div>
    );
};

export default AdminQuotations;
