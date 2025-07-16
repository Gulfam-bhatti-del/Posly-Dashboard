"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card, CardContent } from "@/components/ui/card"; // Import Card components for consistent styling

type Warehouse = {
  id: number;
  name: string;
};

type Product = {
  id: string;
  code: string;
  name: string;
  current_stock: number;
};

type AdjustmentItem = {
  product_id: string;
  code: string;
  name: string;
  current_stock: number;
  qty: number;
  type: "increase" | "decrease";
};

export default function AdjustmentPage() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [details, setDetails] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error } = await supabase.from("warehouses").select("*").order("name");

      if (data && !error) {
        setWarehouses(data);
      } else if (error) {
        toast.error("Error fetching warehouses: " + error.message);
        console.error("Error fetching warehouses:", error);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (search.length < 2) {
      setProducts([]);
      return;
    }

    const searchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, current_stock")
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`)
        .limit(10);

      if (data && !error) {
        setProducts(data);
      } else if (error) {
        toast.error("Error searching products: " + error.message);
        console.error("Error searching products:", error);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const addProduct = (product: Product) => {
    if (adjustmentItems.some((item) => item.product_id === product.id)) {
      toast.warn("Product already added to adjustment");
      return;
    }

    setAdjustmentItems([
      ...adjustmentItems,
      {
        product_id: product.id,
        code: product.code,
        name: product.name,
        current_stock: product.current_stock,
        qty: 1,
        type: "increase",
      },
    ]);

    setSearch("");
    setProducts([]);
  };

  const updateItem = (idx: number, field: keyof AdjustmentItem, value: any) => {
    setAdjustmentItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (idx: number) => {
    setAdjustmentItems((items) => items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId) {
      toast.error("Please select a warehouse");
      return;
    }

    if (adjustmentItems.length === 0) {
      toast.error("Please add at least one product to adjust");
      return;
    }

    setLoading(true);

    try {
      const { data: adjustment, error: adjustmentError } = await supabase
        .from("adjustments")
        .insert([
          {
            date: new Date(date).toISOString(),
            warehouse_id: Number.parseInt(warehouseId),
            details,
          },
        ])
        .select()
        .single();

      if (adjustmentError) {
        throw adjustmentError;
      }

      const items = adjustmentItems.map((item) => ({
        adjustment_id: adjustment.id,
        product_id: item.product_id,
        qty: item.qty,
        type: item.type,
      }));

      const { error: itemsError } = await supabase.from("adjustment_items").insert(items);

      if (itemsError) {
        throw itemsError;
      }

      for (const item of adjustmentItems) {
        const stockChange = item.type === "increase" ? item.qty : -item.qty;
        const newStock = Math.max(0, item.current_stock + stockChange);

        const { error: productUpdateError } = await supabase.from("products").update({ current_stock: newStock }).eq("id", item.product_id);
        if (productUpdateError) {
          console.error(`Error updating stock for product ${item.name}:`, productUpdateError);
          // Decide if you want to throw here or continue
        }
      }

      toast.success("Adjustment created successfully!");
      router.push("/adjustment/all-adjustments");
    } catch (error: any) {
      console.error("Error creating adjustment:", error);
      toast.error("Error creating adjustment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setAdjustmentItems([]);
    setDetails("");
    setWarehouseId("");
    setDate(new Date().toISOString().slice(0, 16));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"> {/* Responsive padding */}
      <ToastContainer position="top-center" />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6 flex-wrap"> {/* Added flex-wrap */}
          <Link href="/adjustment/all-adjustments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Create Stock Adjustment</h1> {/* Responsive text size */}
        </div>

        <Card className="p-4 sm:p-6"> {/* Responsive padding for card */}
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Date & Time *</label>
                  <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Warehouse *</label>
                  <Select value={warehouseId} onValueChange={setWarehouseId} required>
                    <SelectTrigger className="w-full"> {/* Full width */}
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id.toString()}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative">
                <label className="block mb-2 text-sm font-medium">Search Products</label>
                <Input
                  placeholder="Search by product name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
                {products.length > 0 && (
                  <div className="absolute z-10 w-full border rounded-md bg-white mt-1 max-h-48 overflow-auto shadow-lg">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => addProduct(p)}
                      >
                        <div className="font-medium">
                          {p.code} - {p.name}
                        </div>
                        <div className="text-sm text-gray-500">Current Stock: {p.current_stock}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border"> {/* Added border and rounded-lg */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 border-b text-left whitespace-nowrap">#</th>
                      <th className="p-3 border-b text-left whitespace-nowrap">Product Code</th>
                      <th className="p-3 border-b text-left whitespace-nowrap">Product Name</th>
                      <th className="p-3 border-b text-left whitespace-nowrap">Current Stock</th>
                      <th className="p-3 border-b text-left whitespace-nowrap">Quantity</th>
                      <th className="p-3 border-b text-left whitespace-nowrap">Type</th>
                      <th className="p-3 border-b text-left whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustmentItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-gray-500">
                          No products added yet. Search and add products above.
                        </td>
                      </tr>
                    ) : (
                      adjustmentItems.map((item, idx) => (
                        <tr key={item.product_id} className="hover:bg-gray-50">
                          <td className="p-3 border-b whitespace-nowrap">{idx + 1}</td>
                          <td className="p-3 border-b font-medium whitespace-nowrap">{item.code}</td>
                          <td className="p-3 border-b whitespace-nowrap">{item.name}</td>
                          <td className="p-3 border-b whitespace-nowrap">{item.current_stock}</td>
                          <td className="p-3 border-b whitespace-nowrap">
                            <Input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                              className="w-20 sm:w-24" // Responsive width
                            />
                          </td>
                          <td className="p-3 border-b whitespace-nowrap">
                            <Select
                              value={item.type}
                              onValueChange={(val) => updateItem(idx, "type", val as "increase" | "decrease")}
                            >
                              <SelectTrigger className="w-full sm:w-32"> {/* Responsive width */}
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="increase">Increase</SelectItem>
                                <SelectItem value="decrease">Decrease</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 border-b whitespace-nowrap">
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(idx)}>
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Additional Details</label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Enter any additional details about this adjustment..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4"> {/* Responsive button layout */}
                <Button type="button" variant="outline" onClick={handleClearAll} className="w-full sm:w-auto">
                  Clear All
                </Button>
                <Link href="/adjustment/all-adjustments" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || adjustmentItems.length === 0} className="w-full sm:w-auto min-w-32">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Adjustment"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
