import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Download, Upload, Eye, Pencil, Trash2, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { LoadingScreen } from "@/components/LoadingScreen";

type Primitive = string | number | boolean | null;
type TableRecord = Record<string, Primitive>;
interface LooseTable {
  select: (columns: string) => Promise<{ data: TableRecord[] | null; error: unknown }>;
  insert: (rows: Array<Record<string, Primitive>>) => Promise<{ error: unknown }>;
  delete: () => { eq: (col: string, val: string | number) => Promise<{ error: unknown }> };
}
interface LooseSupabase { from: (table: string) => LooseTable }

const AdminTables = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [busy, setBusy] = useState(false);

  const fetchTableData = useCallback(async () => {
    try {
      setBusy(true);
      const sb = supabase as unknown as LooseSupabase;
      const { data, error } = await sb
        .from(selectedTable)
        .select("*");

      if (error) throw error;

      setTableData(data || []);
      if (data && data.length > 0) {
        setColumns(Object.keys(data[0]));
      } else {
        setColumns(DEFAULT_COLUMNS[selectedTable] || []);
      }
    } catch (error: unknown) {
      console.error("Error fetching table data:", error);
      toast.error("Failed to load table data");
    } finally {
      setBusy(false);
    }
  }, [selectedTable]);

  const tables = [
    "boq_projects",
    "civil_metal_work",
    "civil_pcc_work",
    "civil_other_work",
    "electric_work",
    "panel_floor_work",
    "panel_roof_work",
    "panel_wall_work",
    "roofing_work",
    "toilet_bath_plumbing",
    "upvc_doors_windows",
    "wall_putty_work",
    "eco_panel_other_work",
    "custom_field_work",
    "predefined_items",
    "products",
  ];
  const DEFAULT_COLUMNS: Record<string, string[]> = {
    civil_other_work: [
      "id",
      "project_id",
      "item_name",
      "specification",
      "unit",
      "quantity",
      "rate",
      "amount",
      "remarks",
      "created_at",
    ],
    eco_panel_other_work: [
      "id",
      "project_id",
      "item_name",
      "specification",
      "unit",
      "quantity",
      "rate",
      "amount",
      "remarks",
      "created_at",
    ],
    custom_field_work: [
      "id",
      "project_id",
      "item_name",
      "specification",
      "unit",
      "quantity",
      "rate",
      "amount",
      "remarks",
      "created_at",
    ],
  };

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login to access admin panel");
        navigate("/dashboard");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("Failed to verify admin access");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    if (selectedTable && isAdmin) {
      fetchTableData();
    }
  }, [selectedTable, isAdmin, fetchTableData]);

  

  

  const handleExport = () => {
    if (!tableData.length) {
      toast.error("No data to export");
      return;
    }

    try {
      setBusy(true);
      const ws = XLSX.utils.json_to_sheet(tableData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedTable);
      XLSX.writeFile(wb, `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Data exported successfully");
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!columns.length) {
      toast.error("Please select a table first");
      return;
    }

    try {
      setBusy(true);
      const template = columns.reduce<Record<string, string>>((acc, col) => {
        acc[col] = "";
        return acc;
      }, {});
      const ws = XLSX.utils.json_to_sheet([template]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, `${selectedTable}_template.xlsx`);
      toast.success("Template downloaded successfully");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, Primitive>>(worksheet);

      if (!jsonData.length) {
        toast.error("No data found in file");
        return;
      }

      const sb = supabase as unknown as LooseSupabase;
      const { error } = await sb.from(selectedTable).insert(jsonData);

      if (error) throw error;

      toast.success(`Imported ${jsonData.length} records successfully`);
      fetchTableData();
    } catch (error: unknown) {
      console.error("Error importing data:", error);
      const message = typeof error === "object" && error && "message" in (error as Record<string, unknown>)
        ? String((error as Record<string, unknown>).message)
        : "Failed to import data";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: TableRecord) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      setBusy(true);
      const identifier: { col: string; val: string | number } | null = (() => {
        if (row && typeof row === "object") {
          if ("id" in row && row.id != null) {
            const v = row.id;
            return { col: "id", val: typeof v === "string" || typeof v === "number" ? v : String(v) };
          }
          if ("product_code" in row && (row as Record<string, Primitive>).product_code != null) {
            const v = (row as Record<string, Primitive>).product_code as Primitive;
            return { col: "product_code", val: typeof v === "string" || typeof v === "number" ? v : String(v) };
          }
          if ("sn" in row && (row as Record<string, Primitive>).sn != null) {
            const v = (row as Record<string, Primitive>).sn as Primitive;
            return { col: "sn", val: typeof v === "string" || typeof v === "number" ? v : String(v) };
          }
        }
        return null;
      })();

      if (!identifier) {
        toast.error("Unable to determine primary key for deletion");
        return;
      }

      const sb = supabase as unknown as LooseSupabase;
      const { error } = await sb
        .from(selectedTable)
        .delete()
        .eq(identifier.col, identifier.val);

      if (error) throw error;

      toast.success("Record deleted successfully");
      fetchTableData();
    } catch (error: unknown) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    } finally {
      setBusy(false);
    }
  };

  const filteredData = tableData.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Manage Database Tables</h1>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <Select value={selectedTable} onValueChange={(v: string) => setSelectedTable(v)} disabled={busy}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExport} disabled={!tableData.length || busy}>
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>

            <Button onClick={handleDownloadTemplate} variant="outline" disabled={!selectedTable || busy}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <Button variant="outline" asChild disabled={!selectedTable || busy}>
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import from Excel
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>
          </div>
          
          {selectedTable && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search in table..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          )}
        </Card>

        {selectedTable && (
          <Card className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedTable} ({filteredData.length} records)
              </h2>
              {totalPages > 1 && (
                <div className="flex gap-2 items-center">
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
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col}>
                          {String(row[col]).substring(0, 50)}
                          {String(row[col]).length > 50 ? "..." : ""}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => !busy && toast.info("View details coming soon")}
                            disabled={busy}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => !busy && toast.info("Edit functionality coming soon")}
                            disabled={busy}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(row)}
                            disabled={busy}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminTables;
