import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Trash2, Eye, ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingScreen } from "@/components/LoadingScreen";

// Define the shape of our Customer Project
interface CustomerProject {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    project_type: string;
    created_at: string;
    // Add other fields as needed for the detailed view
    [key: string]: any;
}

export default function AdminCustomerInfo() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<CustomerProject[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<CustomerProject[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<CustomerProject | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = projects.filter(
            (p) =>
                p.full_name?.toLowerCase().includes(term) ||
                p.phone?.includes(term) ||
                p.email?.toLowerCase().includes(term)
        );
        setFilteredProjects(filtered);
    }, [searchTerm, projects]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("customer_projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching customer projects:", error);
            toast.error("Failed to load customer projects");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const { error } = await supabase
                .from("customer_projects")
                .delete()
                .eq("id", deleteId);

            if (error) throw error;
            toast.success("Entry deleted successfully");
            fetchProjects();
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast.error("Failed to delete entry");
        } finally {
            setDeleteId(null);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold text-[#1E2D4D]">Customer Information Requests</h1>
                    </div>
                    <Button onClick={() => navigate("/customer-info")} className="bg-[#EF7E1E] hover:bg-[#d66c15]">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Entry
                    </Button>
                </div>

                <Card className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Project Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No entries found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProjects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{project.full_name}</TableCell>
                                        <TableCell>{project.phone}</TableCell>
                                        <TableCell>{project.email}</TableCell>
                                        <TableCell>{project.project_type || "N/A"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedProject(project)}
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDeleteId(project.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer information entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Details Modal */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Project Details - {selectedProject?.full_name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[70vh] pr-4">
                        {selectedProject && (
                            <div className="space-y-6">
                                <Section title="Contact Info">
                                    <Detail label="Phone" value={selectedProject.phone} />
                                    <Detail label="Email" value={selectedProject.email} />
                                    <Detail label="Preferred Date" value={selectedProject.date} />
                                </Section>

                                <Section title="Address">
                                    <Detail label="Province" value={selectedProject.province} />
                                    <Detail label="District" value={selectedProject.district} />
                                    <Detail label="Municipality" value={selectedProject.municipality} />
                                    <Detail label="Ward" value={selectedProject.ward} />
                                    <Detail label="Street" value={selectedProject.street} />
                                    <Detail label="House No" value={selectedProject.house_no} />
                                </Section>

                                <Section title="Project Overview">
                                    <Detail label="Type" value={selectedProject.project_type} />
                                    {selectedProject.project_type_other && <Detail label="Other Type" value={selectedProject.project_type_other} />}
                                    <Detail label="Land Area" value={selectedProject.land_area} />
                                    <Detail label="Square Footage" value={selectedProject.square_footage} />
                                    <Detail label="Scope" value={selectedProject.project_scope} />
                                    <Detail label="Target Completion" value={selectedProject.completion_date} />
                                    <Detail label="Vision" value={selectedProject.vision} fullWidth />
                                </Section>

                                <Section title="Site Details">
                                    <Detail label="Storeys" value={selectedProject.storeys} />
                                    <Detail label="Topography" value={selectedProject.site_topography} />
                                    <Detail label="Drainage" value={selectedProject.water_drainage} />
                                    <Detail label="Direction" value={selectedProject.direction} />
                                    <Detail label="Addl. Site Info" value={selectedProject.additional_site_info} fullWidth />
                                </Section>

                                <Section title="Requirements">
                                    <Detail label="Num Rooms" value={selectedProject.num_rooms} />
                                    <Detail label="Rooms Details" value={JSON.stringify(selectedProject.rooms, null, 2)} fullWidth code />
                                    <Detail label="Addl. Spaces" value={selectedProject.additional_spaces} fullWidth />
                                    <Detail label="Accessibility" value={selectedProject.accessibility} fullWidth />
                                </Section>

                                <Section title="Infrastructure & Other">
                                    <Detail label="Road Access Size" value={selectedProject.road_access_size} />
                                    <Detail label="Road Type" value={Array.isArray(selectedProject.road_type) ? selectedProject.road_type.join(", ") : selectedProject.road_type} />
                                    <Detail label="Heard From" value={Array.isArray(selectedProject.heard_from) ? selectedProject.heard_from.join(", ") : selectedProject.heard_from} />
                                    <Detail label="Other Details" value={selectedProject.other_details} fullWidth />
                                </Section>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <h3 className="text-lg font-semibold border-b pb-1 text-gray-700">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
);

const Detail = ({ label, value, fullWidth, code }: { label: string; value: any; fullWidth?: boolean; code?: boolean }) => {
    if (!value) return null;
    return (
        <div className={`${fullWidth ? "col-span-1 md:col-span-2" : ""}`}>
            <span className="block text-xs font-medium text-gray-500 uppercase">{label}</span>
            {code ? (
                <pre className="mt-1 text-sm bg-gray-100 p-2 rounded overflow-x-auto">{value}</pre>
            ) : (
                <p className="mt-1 text-sm text-gray-900">{value}</p>
            )}
        </div>
    );
};
