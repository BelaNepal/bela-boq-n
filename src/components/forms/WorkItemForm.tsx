import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface WorkItem {
  id: string;
  itemNumber: number;
  itemName: string;
  specification: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks: string;
  source?: "custom" | "predefined" | "product";
  // Optional eco product fields
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
  price_with_vat?: number | null;
  category?: string | null;
}

interface WorkItemFormProps {
  data: WorkItem[];
  onChange: (data: WorkItem[]) => void;
  title: string;
  category: string;
  projectId?: string;
}

interface PredefinedItem {
  id: string;
  item_name: string;
  specification: string;
  unit: string;
  standard_rate: number;
}

const WorkItemForm = ({ data, onChange, title, category, projectId }: WorkItemFormProps) => {
  const [predefinedItems, setPredefinedItems] = useState<PredefinedItem[]>([]);
  const [predefinedSearch, setPredefinedSearch] = useState("");
  
  const ECO_CATEGORIES = [
    "Bela Naked Panel (without CSB)",
    "Bela T Shape Panel",
    "Bela L Shape Panel",
    "Bela Hollow Eco-panel with CSB",
    "Bela Hollow Naked Panel",
    "Bela Hollow T Shape Panel",
    "Bela Hollow L Shape Panel",
    "metal",
  ];
  useEffect(() => {
    const fetchPredefinedItems = async () => {
      try {
        // fetch generic predefined items for this form category
        const { data: items }: any = await supabase
          .from("predefined_items")
          .select("*")
          .eq("category", category);

        // fetch all product rows (don't filter by category so every product is available)
        const { data: products }: any = await (supabase as any)
          .from("products")
          .select("*")
          .limit(1000);

        console.debug("Fetched predefined_items:", (items || []).length, "products:", (products || []).length);

        const inferUnit = (size: any) => {
          if (!size) return "pcs";
          const s = String(size).toLowerCase();
          if (/sq\s?ft|sqft/.test(s)) return "sqft";
          if (/sq\s?m|sqm|sq\.m/.test(s)) return "sqm";
          if (/\bkg\b|kg/.test(s)) return "kg";
          if (/\bton\b|t\b/.test(s)) return "t";
          if (/\bmm\b/.test(s)) return "mm";
          if (/\bcm\b/.test(s)) return "cm";
          if (/\bft\b|feet/.test(s)) return "ft";
          if (/\bm\b|\d+x?\d*m\b/.test(s) || /m$/.test(s)) return "m";
          return "pcs";
        };

        const mappedProducts: PredefinedItem[] = ["panel_floor_work", "panel_wall_work", "panel_roof_work"].includes(category)
          ? (products || []).map((p: any, idx: number) => ({
              id:
                p.sn != null
                  ? `prod:sn:${p.sn}`
                  : p.product_code
                  ? `prod:code:${p.product_code}:${idx}`
                  : p.bela_prod_code
                  ? `prod:bela:${p.bela_prod_code}:${idx}`
                  : `prod:idx:${idx}`,
              item_name: p.product_name || "",
              specification: p.product_size || "",
              unit: p.unit ?? (p.sqft ? "sqft" : inferUnit(p.product_size)),
              standard_rate: Number(p.price_with_vat ?? p.rate ?? 0),
            }))
          : [];

        const combined: PredefinedItem[] = [
          ...(items || []),
          ...mappedProducts,
        ];

        setPredefinedItems(combined);
      } catch (err) {
        console.error("Error fetching predefined/eco products", err);
      }
    };

    fetchPredefinedItems();
  }, [category]);
  
  const addItem = () => {
    // Get the highest item number and add 1
    const maxItemNumber = data.length > 0 ? Math.max(...data.map(item => item.itemNumber)) : 0;
    const newItem: WorkItem = {
      id: Date.now().toString(),
      itemNumber: maxItemNumber + 1,
      itemName: "",
      specification: "",
      unit: "",
      quantity: 0,
      rate: 0,
      amount: 0,
      remarks: "",
      source: "custom",
    };
    onChange([newItem, ...data]); // Add new item at the beginning
  };

  const removeItem = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof WorkItem, value: any) => {
    const updatedData = data.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate amount when quantity or rate changes
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        
        return updatedItem;
      }
      return item;
    });
    onChange(updatedData);
  };

  const selectPredefinedItem = async (itemId: string, predefinedItemId: string) => {
    const predefined = predefinedItems.find((item) => item.id === predefinedItemId);
    if (!predefined) return;

    // If the item came from the products table (id prefixed with prod:), fetch full product details
    const isProduct = predefined.id.startsWith("prod:");
    let productDetails: any | null = null;

    if (isProduct) {
      const parts = predefined.id.split(":");
      let whereCol: string | null = null;
      let whereVal: string | number | null = null;
      if (parts[1] === "sn" && parts[2]) {
        whereCol = "sn";
        whereVal = Number(parts[2]);
      } else if (parts[1] === "code" && parts[2]) {
        whereCol = "product_code";
        whereVal = parts[2];
      } else if (parts[1] === "bela" && parts[2]) {
        whereCol = "bela_prod_code";
        whereVal = parts[2];
      }
      if (whereCol && whereVal != null) {
        try {
          const { data: products }: any = await (supabase as any)
            .from("products")
            .select("*")
            .eq(whereCol as any, whereVal as any)
            .limit(1);
          productDetails = (products && products[0]) || null;
        } catch (err) {
          console.error("Failed to fetch product detail", err);
        }
      }
    }

    const updatedData = data.map((d) => {
      if (d.id !== itemId) return d;

      const base: any = {
        ...d,
        // default from predefined mapping; overridden by productDetails when present
        itemName: predefined.item_name,
        specification: predefined.specification || "",
        unit: predefined.unit,
        quantity: d.quantity ?? 0,
        rate: predefined.standard_rate,
        amount: (d.quantity ?? 0) * predefined.standard_rate,
        source: isProduct ? "product" : "predefined",
      };

      if (productDetails) {
        base.sn = productDetails.sn ?? null;
        base.product_code = productDetails.product_code ?? null;
        base.bela_prod_code = productDetails.bela_prod_code ?? null;
        base.product_name = productDetails.product_name ?? null;
        // ensure itemName maps to product_name as requested
        base.itemName = productDetails.product_name ?? base.itemName;
        // product_size -> specification
        base.specification = productDetails.product_size ?? base.specification;
        base.product_size = productDetails.product_size ?? null;
        base.t_mtr = productDetails.t_mtr ?? null;
        base.w_mtr = productDetails.w_mtr ?? null;
        base.l_mtr = productDetails.l_mtr ?? null;
        base.m3 = productDetails.m3 ?? null;
        base.w_ft = productDetails.w_ft ?? null;
        base.l_ft = productDetails.l_ft ?? null;
        base.sqft = productDetails.sqft ?? null;
        base.weight = productDetails.weight ?? null;
        // prefer price_with_vat as the actual rate
        base.rate = Number(productDetails.price_with_vat ?? productDetails.rate ?? base.rate) ?? base.rate;
        base.price_with_vat = productDetails.price_with_vat ?? null;
        base.category = productDetails.category ?? null;
        // prefer explicit unit field; otherwise prefer sqft or infer from product_size
        let inferredUnit = base.unit || "pcs";
        if (productDetails.unit) {
          inferredUnit = productDetails.unit;
        } else if (productDetails.sqft) {
          inferredUnit = "sqft";
        } else if (productDetails.product_size) {
          const s = String(productDetails.product_size).toLowerCase();
          if (/sq\s?ft|sqft/.test(s)) inferredUnit = "sqft";
          else if (/sq\s?m|sqm|sq\.m/.test(s)) inferredUnit = "sqm";
          else if (/\bkg\b|kg/.test(s)) inferredUnit = "kg";
          else if (/\bmm\b/.test(s)) inferredUnit = "mm";
          else if (/\bcm\b/.test(s)) inferredUnit = "cm";
          else if (/\bft\b|feet/.test(s)) inferredUnit = "ft";
          else if (/m\b|\d+x?\d*m\b/.test(s) || /m$/.test(s)) inferredUnit = "m";
        }
        base.unit = inferredUnit;
        // ensure quantity is numeric and update amount after rate change
        base.quantity = Number(base.quantity ?? 0);
        base.amount = Number(base.quantity) * Number(base.rate ?? 0);
      }

      return base;
    });

    onChange(updatedData);

    if (isProduct && projectId && ["panel_floor_work", "panel_roof_work", "panel_wall_work"].includes(category)) {
      const current = updatedData.find((d) => d.id === itemId);
      if (current) {
        const payload: any = {
          project_id: projectId,
          item_name: current.itemName,
          specification: current.specification,
          unit: current.unit,
          quantity: Number(current.quantity) || 0,
          rate: Number(current.rate) || 0,
          amount: Number(current.amount) || 0,
          remarks: current.remarks || null,
        };
        try {
          await (supabase as any)
            .from(category)
            .insert(payload);
        } catch (e) {
          console.error("Failed to save product selection", e);
        }
      }
    }
  };

  const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-4">
      {data.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total Amount:</span>
            <span className="text-2xl font-bold text-primary">NPR {total.toFixed(2)}</span>
          </div>
        </Card>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button onClick={addItem} variant="navy" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {data.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">No items added yet. Click "Add Item" to get started.</p>
        </Card>
      )}

      <div className="space-y-4">
        {data.map((item, index) => (
          <Card key={item.id} className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {item.itemNumber}
                </span>
                <h4 className="font-semibold text-secondary">Item #{item.itemNumber}</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[11px]">Select from Predefined Items (Optional)</Label>
                <Select onValueChange={(value) => selectPredefinedItem(item.id, value)}>
                  <SelectTrigger className="bg-popover h-9">
                    <SelectValue placeholder="Choose a standard item or enter custom below" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-popover z-50"
                    header={
                      <div className="p-2 bg-popover border-b">
                        <Input
                          placeholder="Search items..."
                          value={predefinedSearch}
                          onChange={(e) => setPredefinedSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    }
                  >
                      {predefinedItems
                        .filter((p) => {
                          const term = predefinedSearch.toLowerCase();
                          if (!term) return true;
                          return (
                            p.item_name.toLowerCase().includes(term) ||
                            (p.specification || "").toLowerCase().includes(term) ||
                            p.unit.toLowerCase().includes(term)
                          );
                        })
                        .map((predefined) => {
                          const isProduct = predefined.id.startsWith("prod:");
                          return (
                            <SelectItem key={predefined.id} value={predefined.id}>
                              {isProduct ? "Bela: " : ""}
                              {predefined.item_name} - {predefined.specification} (NPR {predefined.standard_rate}/{predefined.unit})
                            </SelectItem>
                          );
                        })}
                    {predefinedItems.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No predefined items</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-12 gap-3">
                <div className="md:col-span-4 space-y-1">
                  <Label className="text-[11px]">Item Name</Label>
                  <Input
                    className="h-9"
                    placeholder="Enter item name"
                    value={item.itemName}
                    maxLength={120}
                    onChange={(e) => updateItem(item.id, "itemName", e.target.value.slice(0, 120))}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px]">Unit</Label>
                  <Input
                    className="h-9"
                    placeholder="e.g., sqm"
                    value={item.unit}
                    maxLength={20}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value.slice(0, 20))}
                  />
                </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[11px]">Quantity</Label>
                      <Input
                        className="h-9"
                        type="number"
                        inputMode="decimal"
                        enterKeyHint="next"
                        placeholder="0"
                        // render numeric values as strings so `0` is visible and not treated as empty
                        value={item.quantity != null ? String(item.quantity) : "0"}
                        onChange={(e) => {
                          const v = e.target.value;
                          const n = v === "" ? 0 : Number(v);
                          updateItem(item.id, "quantity", Number.isNaN(n) ? 0 : n);
                        }}
                      />
                    </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px]">Rate</Label>
                  <Input
                    className="h-9"
                    type="number"
                    inputMode="decimal"
                    enterKeyHint="next"
                    placeholder="0.00"
                        value={item.rate != null ? String(item.rate) : "0"}
                        onChange={(e) => {
                          const v = e.target.value;
                          const n = v === "" ? 0 : Number(v);
                          updateItem(item.id, "rate", Number.isNaN(n) ? 0 : n);
                        }}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px]">Amount</Label>
                  <Input
                    className="h-9 bg-primary/5 font-semibold"
                    type="number"
                    placeholder="0.00"
                    value={item.amount.toFixed(2)}
                    disabled
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Specification</Label>
                  <Textarea
                    placeholder="Enter specifications"
                    value={item.specification}
                    rows={2}
                    maxLength={500}
                    onChange={(e) => updateItem(item.id, "specification", e.target.value.slice(0, 500))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Remarks</Label>
                  <Input
                    placeholder="Additional remarks"
                    value={item.remarks}
                    maxLength={500}
                    onChange={(e) => updateItem(item.id, "remarks", e.target.value.slice(0, 500))}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkItemForm;
