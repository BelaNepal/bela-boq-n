import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatNepaliCurrency } from "@/lib/formatters";
import { LoadingScreen } from "@/components/LoadingScreen";

interface PredefinedItem {
  id: string;
  item_name: string;
  specification: string | null;
  unit: string;
  category: string;
  standard_rate: number;
}

const AdminItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<PredefinedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PredefinedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PredefinedItem | null>(null);
  const [formData, setFormData] = useState({
    item_name: "",
    specification: "",
    unit: "",
    category: "",
    standard_rate: 0,
  });
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const getDisplayCategory = (value: string) =>
    String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchItems();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterItems();
  }, [searchTerm, items]);

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
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("Failed to verify admin access");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("predefined_items")
        .select("*")
        .order("category", { ascending: true })
        .order("item_name", { ascending: true });

      if (error) throw error;
      setItems(data || []);

      const { data: prodCats, error: prodErr } = await (supabase as any)
        .from("products")
        .select("category")
        .limit(1000);

      if (!prodErr && prodCats) {
        const cats = ((prodCats || []) as Array<{ category?: string | null }>)
          .map((p) => String(p.category ?? "").trim())
          .filter((c) => c.length > 0);
        const uniqueProdCats: string[] = Array.from(new Set(cats));
        setProductCategories(uniqueProdCats);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    }
  };

  const filterItems = () => {
    if (!searchTerm) {
      setFilteredItems(items);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.item_name.toLowerCase().includes(term) ||
        getDisplayCategory(item.category).toLowerCase().includes(term) ||
        item.specification?.toLowerCase().includes(term)
    );
    setFilteredItems(filtered);
    setCurrentPage(1);
  };

  const uniqueCategories = Array.from(
    new Set([...(items.map((i) => i.category)), ...productCategories])
  ).sort();

  const handleOpenDialog = (item?: PredefinedItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        item_name: item.item_name,
        specification: item.specification || "",
        unit: item.unit,
        category: item.category || "",
        standard_rate: item.standard_rate,
      });
    } else {
      setEditingItem(null);
      setFormData({
        item_name: "",
        specification: "",
        unit: "",
        category: "",
        standard_rate: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("predefined_items")
          .update(formData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item updated successfully");
      } else {
        const { error } = await supabase
          .from("predefined_items")
          .insert([formData]);

        if (error) throw error;
        toast.success("Item added successfully");
      }

      setIsDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("predefined_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Manage Predefined Items</h1>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, category, or specification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="mb-3 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Items ({filteredItems.length})</h2>
            {Math.ceil(filteredItems.length / itemsPerPage) > 1 && (
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(filteredItems.length / itemsPerPage) || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredItems.length / itemsPerPage) || 1, p + 1))}
                  disabled={currentPage === (Math.ceil(filteredItems.length / itemsPerPage) || 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Specification</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>{getDisplayCategory(item.category)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.specification || "-"}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">
                      {formatNepaliCurrency(item.standard_rate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value, standard_rate: productCategories.includes(value) ? 0 : formData.standard_rate })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getDisplayCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Specification</Label>
                <Input
                  value={formData.specification}
                  onChange={(e) =>
                    setFormData({ ...formData, specification: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  />
                </div>
                {!productCategories.includes(formData.category) && (
                  <div className="space-y-2">
                    <Label>Standard Rate (₹)</Label>
                    <Input
                      type="number"
                      value={formData.standard_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          standard_rate: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminItems;
