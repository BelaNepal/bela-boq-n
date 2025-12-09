import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Download, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";

interface Product {
  sn?: number | null;
  product_code?: string | null;
  bela_prod_code?: string | null;
  product_name?: string | null;
  product_size?: string | null;
  t_mtr?: number | null;
  w_mtr?: number | null;
  l_mtr?: number | null;
  m3?: number | null;
  w_ft?: number | null;
  l_ft?: number | null;
  sqft?: number | null;
  weight?: number | null;
  thickness?: number | null;
  rate?: number | null;
  price_with_vat?: number | null;
  category?: string | null;
}

const AdminProducts = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Product>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const itemsPerPage = 20;

  const EXPORT_COLUMNS: (keyof Product)[] = [
    "product_code",
    "bela_prod_code",
    "product_name",
    "product_size",
    "thickness",
    "price_with_vat",
    "category",
    "t_mtr",
    "w_mtr",
    "l_mtr",
    "m3",
    "w_ft",
    "l_ft",
    "sqft",
    "weight",
  ];

  const CATEGORY_OPTIONS = [
    { label: "Civil Metal Work", value: "civil-metal-work" },
    { label: "Civil PCC Work", value: "civil-pcc-work" },
    { label: "Panel Floor Work", value: "panel-floor-work" },
    { label: "Panel Roof Work", value: "panel-roof-work" },
    { label: "Panel Wall Work", value: "panel-wall-work" },
    { label: "UPVC Doors & Windows", value: "upvc-doors-windows" },
    { label: "Toilet, Bath & Plumbing", value: "toilet-bath-plumbing" },
    { label: "Wall Putty Work", value: "wall-putty-work" },
    { label: "Electric Work", value: "electric-work" },
    { label: "Roofing Work", value: "roofing-work" },
    { label: "Other", value: "other" },
  ];

  const downloadTemplate = () => {
    const templateData = [
      {
        product_code: "EX001",
        bela_prod_code: "BP001",
        product_name: "Example Product",
        product_size: "1x2m",
        thickness: 10,
        price_with_vat: 5000,
        category: "civil-metal-work",
        t_mtr: 2,
        w_mtr: 1,
        l_mtr: 2,
        m3: 2,
        w_ft: 3.28,
        l_ft: 6.56,
        sqft: 21.5,
        weight: 50,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_template.xlsx");
    toast.success("Template downloaded successfully");
  };

  const exportProducts = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }

    const exportData = products.map((p) => {
      const row: any = {};
      EXPORT_COLUMNS.forEach((col) => {
        row[col] = p[col] ?? "";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `products_export_${new Date().getTime()}.xlsx`);
    toast.success(`Exported ${products.length} products`);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      if (data.length === 0) {
        toast.error("No data found in file");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          const payload: any = {
            product_code: row.product_code || null,
            bela_prod_code: row.bela_prod_code || null,
            product_name: row.product_name || null,
            product_size: row.product_size || null,
            thickness: row.thickness ? Number(row.thickness) : null,
            price_with_vat: row.price_with_vat ? Number(row.price_with_vat) : null,
            category: row.category || null,
            t_mtr: row.t_mtr ? Number(row.t_mtr) : null,
            w_mtr: row.w_mtr ? Number(row.w_mtr) : null,
            l_mtr: row.l_mtr ? Number(row.l_mtr) : null,
            m3: row.m3 ? Number(row.m3) : null,
            w_ft: row.w_ft ? Number(row.w_ft) : null,
            l_ft: row.l_ft ? Number(row.l_ft) : null,
            sqft: row.sqft ? Number(row.sqft) : null,
            weight: row.weight ? Number(row.weight) : null,
          };

          // Remove null/undefined values for clean insert
          Object.keys(payload).forEach((key) => {
            if (payload[key] === null || payload[key] === undefined) {
              delete payload[key];
            }
          });

          const { error } = await (supabase as any)
            .from("products")
            .insert([payload]);

          if (error) {
            console.error("Row error:", error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (e) {
          console.error("Row parse error:", e);
          errorCount++;
        }
      }

      await fetchProducts();
      toast.success(
        `Import complete: ${successCount} added${errorCount > 0 ? `, ${errorCount} failed` : ""}`
      );
    } catch (e: any) {
      console.error("Import error:", e);
      toast.error("Failed to import file: " + e.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) fetchProducts();
  }, [isAdmin]);

  useEffect(() => {
    const term = search.toLowerCase();
    if (!term) {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter((p) =>
          [
            p.product_name,
            p.product_code,
            p.bela_prod_code,
            p.product_size,
            p.category,
          ]
            .map((v) => String(v || "").toLowerCase())
            .some((v) => v.includes(term))
        )
      );
    }
    setCurrentPage(1);
  }, [search, products]);

  const checkAdminAccess = async () => {
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
    } catch (e) {
      console.error(e);
      toast.error("Failed to verify admin access");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*")
        .order("product_name", { ascending: true })
        .limit(1000);
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.error("Error fetching products", e);
      toast.error("Failed to load products");
    }
  };

  const openDialog = (p?: Product) => {
    if (p) {
      setEditing(p);
      setForm({ ...p });
    } else {
      setEditing(null);
      setForm({});
    }
    setIsDialogOpen(true);
  };

  const upsertProduct = async () => {
    try {
      const payload: any = { ...form };
      [
        "t_mtr",
        "w_mtr",
        "l_mtr",
        "m3",
        "w_ft",
        "l_ft",
        "sqft",
        "weight",
        "thickness",
        "rate",
        // price_with_vat is generated in DB; do not send
      ].forEach((k) => {
        if (payload[k] === "" || payload[k] === undefined) payload[k] = null;
        if (payload[k] !== null) payload[k] = Number(payload[k]);
      });

      // Remove forbidden/generated column from payload
      delete payload.rate;

      if (editing) {
        const where = editing.product_code
          ? { col: "product_code", val: editing.product_code }
          : editing.sn
          ? { col: "sn", val: editing.sn }
          : null;
        if (!where) {
          toast.error("Missing identifier to update product");
          return;
        }
        const { error } = await (supabase as any)
          .from("products")
          .update(payload)
          .eq(where.col as any, where.val as any);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await (supabase as any).from("products").insert([payload]);
        if (error) throw error;
        toast.success("Product added");
      }
      setIsDialogOpen(false);
      fetchProducts();
    } catch (e: any) {
      console.error("Error saving product", e);
      toast.error("Failed to save product: " + e.message);
    }
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm("Delete this product?")) return;
    try {
      const where = p.product_code
        ? { col: "product_code", val: p.product_code }
        : p.sn
        ? { col: "sn", val: p.sn }
        : null;
      if (!where) {
        toast.error("Missing identifier to delete");
        return;
      }
      const { error } = await (supabase as any)
        .from("products")
        .delete()
        .eq(where.col as any, where.val as any);
      if (error) throw error;
      toast.success("Product deleted");
      fetchProducts();
    } catch (e) {
      console.error("Error deleting product", e);
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Manage Products</h1>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={downloadTemplate} title="Download template with example data">
              <FileText className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" onClick={exportProducts}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={triggerFileInput} disabled={isImporting}>
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, code, size, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Products ({filtered.length})</h2>
            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.N.</TableHead>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Bela Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Thickness</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{p.sn ?? "-"}</TableCell>
                    <TableCell>{p.product_code ?? "-"}</TableCell>
                    <TableCell>{p.bela_prod_code ?? "-"}</TableCell>
                    <TableCell className="font-medium">{p.product_name ?? "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{p.product_size ?? "-"}</TableCell>
                    <TableCell>{p.thickness ?? "-"}</TableCell>
                    <TableCell>{p.price_with_vat ?? "-"}</TableCell>
                    <TableCell>{p.category ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDialog(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteProduct(p)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2 items-center mt-4">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          )}
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Code</Label>
                <Input value={form.product_code ?? ""} onChange={(e) => setForm({ ...form, product_code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bela Product Code</Label>
                <Input value={form.bela_prod_code ?? ""} onChange={(e) => setForm({ ...form, bela_prod_code: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Product Name</Label>
                <Input value={form.product_name ?? ""} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Product Size</Label>
                <Input value={form.product_size ?? ""} onChange={(e) => setForm({ ...form, product_size: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Thickness</Label>
                <Input type="number" value={form.thickness ?? ""} onChange={(e) => setForm({ ...form, thickness: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Rate (NPR)</Label>
                <Input type="number" value={form.rate ?? ""} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Price With VAT (NPR)</Label>
                <Input type="number" value={form.price_with_vat ?? ""} onChange={(e) => setForm({ ...form, price_with_vat: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category ?? ""}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total (m)</Label>
                <Input type="number" value={form.t_mtr ?? ""} onChange={(e) => setForm({ ...form, t_mtr: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Width (m)</Label>
                <Input type="number" value={form.w_mtr ?? ""} onChange={(e) => setForm({ ...form, w_mtr: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Length (m)</Label>
                <Input type="number" value={form.l_mtr ?? ""} onChange={(e) => setForm({ ...form, l_mtr: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Volume (m3)</Label>
                <Input type="number" value={form.m3 ?? ""} onChange={(e) => setForm({ ...form, m3: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Width (ft)</Label>
                <Input type="number" value={form.w_ft ?? ""} onChange={(e) => setForm({ ...form, w_ft: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Length (ft)</Label>
                <Input type="number" value={form.l_ft ?? ""} onChange={(e) => setForm({ ...form, l_ft: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Area (sqft)</Label>
                <Input type="number" value={form.sqft ?? ""} onChange={(e) => setForm({ ...form, sqft: parseFloat(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input type="number" value={form.weight ?? ""} onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || null })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={upsertProduct}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminProducts;
