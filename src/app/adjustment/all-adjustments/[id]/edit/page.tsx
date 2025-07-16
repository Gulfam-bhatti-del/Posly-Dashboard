"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { HiAdjustments } from "react-icons/hi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

type Warehouse = {
  id: number;
  name: string;
};

type Product = {
  id: string;
  code: string;
  name: string;
  current_stock: number;
  category: string;
  brand: string | null;
};

type AdjustmentItem = {
  id?: string;
  product_id: string;
  code: string;
  name: string;
  current_stock: number;
  qty: number;
  type: "increase" | "decrease";
  old_stock?: number; // This might be useful for tracking original stock before adjustment
};

// New type definition for items fetched with product details
type OriginalAdjustmentItem = {
  product_id: string;
  qty: number;
  type: "increase" | "decrease";
  products: { current_stock: number }[]; // products is an array of objects
};

type AdjustmentDetail = {
  id: string;
  ref: string;
  date: string;
  warehouse_id: number;
  details: string;
};

export default function EditAdjustmentPage() {
  const params = useParams();
  const router = useRouter();
  const [adjustment, setAdjustment] = useState<AdjustmentDetail | null>(null);
  const [date, setDate] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [details, setDetails] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [loading, setLoading] = useState(false); // For form submission loading
  const [initialLoading, setInitialLoading] = useState(true); // For initial data fetch loading
  const [searchLoading, setSearchLoading] = useState(false); // For product search loading

  useEffect(() => {
    if (params.id) {
      fetchAdjustmentData(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Search products
  useEffect(() => {
    if (search.length < 2) {
      setProducts([]);
      return;
    }

    const searchProducts = async () => {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, current_stock, category, brand")
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`)
        .limit(10);

      if (data && !error) {
        setProducts(data);
      } else if (error) {
        toast.error("Error searching products: " + error.message);
        console.error("Error searching products:", error);
      }
      setSearchLoading(false);
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchWarehouses = async () => {
    const { data, error } = await supabase.from("warehouses").select("*").order("name");
    if (data && !error) {
      setWarehouses(data);
    } else if (error) {
      toast.error("Error fetching warehouses: " + error.message);
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchAdjustmentData = async (id: string) => {
    setInitialLoading(true);
    try {
      // Fetch adjustment details
      const { data: adjustmentData, error: adjustmentError } = await supabase
        .from("adjustments")
        .select("*")
        .eq("id", id)
        .single();

      if (adjustmentError) {
        console.error("Error fetching adjustment:", adjustmentError);
        toast.error("Error loading adjustment details");
        router.push("/adjustment/all-adjustments");
        return;
      }

      // Fetch adjustment items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from("adjustment_items")
        .select(`
          id,
          product_id,
          qty,
          type,
          products (
            code,
            name,
            current_stock
          )
        `)
        .eq("adjustment_id", id);

      if (itemsError) {
        console.error("Error fetching adjustment items:", itemsError);
        toast.error("Error loading adjustment items");
        return;
      }

      setAdjustment(adjustmentData);
      setDate(new Date(adjustmentData.date).toISOString().slice(0, 16));
      setWarehouseId(adjustmentData.warehouse_id?.toString() || "");
      setDetails(adjustmentData.details || "");

      // Transform items data
      const transformedItems =
        itemsData?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          code: item.products.code,
          name: item.products.name,
          current_stock: item.products.current_stock,
          qty: item.qty,
          type: item.type,
        })) || [];

      setAdjustmentItems(transformedItems);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error loading adjustment data");
      router.push("/adjustment/all-adjustments");
    } finally {
      setInitialLoading(false);
    }
  };

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
    setAdjustmentItems((items) => items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
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
      const { error: adjustmentError } = await supabase
        .from("adjustments")
        .update({
          date: new Date(date).toISOString(),
          warehouse_id: Number.parseInt(warehouseId),
          details,
        })
        .eq("id", params.id as string);

      if (adjustmentError) {
        throw adjustmentError;
      }

      // Revert stock for original items
      const { data: originalItems, error: originalItemsError } = await supabase
        .from("adjustment_items")
        .select(`
          product_id,
          qty,
          type,
          products (current_stock)
        `);

      if (originalItemsError) {
        throw originalItemsError;
      }

      for (const item of originalItems || []) {
        // Access current_stock from the first element of the products array
        const currentProductStock = item.products[0]?.current_stock || 0;
        const originalStockChange = item.type === "increase" ? -item.qty : item.qty;
        const revertedStock = currentProductStock + originalStockChange;

        await supabase
          .from("products")
          .update({ current_stock: Math.max(0, revertedStock) })
          .eq("id", item.product_id);
      }

      // Delete old adjustment items
      const { error: deleteError } = await supabase
        .from("adjustment_items")
        .delete()
        .eq("adjustment_id", params.id as string);

      if (deleteError) {
        throw deleteError;
      }

      const itemsToInsert = [];
      const stockUpdates = [];

      // Prepare new items and stock updates
      for (const item of adjustmentItems) {
        const { data: productData, error: productFetchError } = await supabase
          .from("products")
          .select("current_stock")
          .eq("id", item.product_id)
          .single();

        if (productFetchError) {
          console.error(`Error fetching current stock for product ${item.name}:`, productFetchError);
          toast.error(`Failed to get current stock for ${item.name}`);
          continue; // Continue to next item or handle as critical error
        }

        const currentStock = productData?.current_stock || 0;
        const stockChange = item.type === "increase" ? item.qty : -item.qty;
        const newStock = Math.max(0, currentStock + stockChange);

        itemsToInsert.push({
          adjustment_id: params.id as string,
          product_id: item.product_id,
          qty: item.qty,
          type: item.type,
        });

        stockUpdates.push({
          id: item.product_id,
          current_stock: newStock,
        });
      }

      const { error: itemsInsertError } = await supabase.from("adjustment_items").insert(itemsToInsert);

      if (itemsInsertError) {
        throw itemsInsertError;
      }

      for (const update of stockUpdates) {
        const { error: productUpdateError } = await supabase.from("products").update({ current_stock: update.current_stock }).eq("id", update.id);
        if (productUpdateError) {
          console.error(`Error updating stock for product ${update.id}:`, productUpdateError);
          toast.error(`Failed to update stock for product ${update.id}`);
        }
      }

      toast.success("Adjustment updated successfully!");
      router.push("/adjustment/all-adjustments");
    } catch (error: any) {
      console.error("Error updating adjustment:", error);
      toast.error("Error updating adjustment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateNewStock = (item: AdjustmentItem) => {
    const change = item.type === "increase" ? item.qty : -item.qty;
    return Math.max(0, item.current_stock + change);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
            <span className="ml-3 mt-2 text-lg text-gray-700">Loading adjustment data...</span>
          </div>
          <Card className="mt-6 p-4 sm:p-6">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card className="mt-6 p-4 sm:p-6">
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6 p-4 sm:p-6">
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-6" /></th>
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-20" /></th>
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-24" /></th>
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-20" /></th>
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-16" /></th>
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-16" /></th>
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-16" /></th>
                    <th className="p-3 border-b text-left"><Skeleton className="h-4 w-12" /></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-4" /></td>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-3 border-b"><Skeleton className="h-4 w-12" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <div className="flex justify-end space-x-4 mt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <ToastContainer position="top-center" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Adjustment Not Found</h2>
            <p className="text-gray-600 mb-6">The adjustment you're trying to edit doesn't exist or has been deleted.</p>
            <Link href="/adjustment/all-adjustments">
              <Button>Back to Adjustments</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"> {/* Responsive padding */}
      <ToastContainer position="top-center" />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6 flex-wrap"> {/* Added flex-wrap */}
          <Link href="/adjustment/all-adjustments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Edit Stock Adjustment</h1> {/* Responsive text size */}
            <p className="text-gray-600 text-sm sm:text-base">{adjustment.ref}</p> {/* Responsive text size */}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 sm:p-6"> {/* Responsive padding for card */}
            <CardHeader className="p-0 pb-4"> {/* Adjusted padding */}
              <CardTitle className="text-lg sm:text-xl">Adjustment Information</CardTitle> {/* Responsive text size */}
            </CardHeader>
            <CardContent className="p-0"> {/* Adjusted padding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Date & Time *</label>
                  <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full" /> {/* Full width */}
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

              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium">Additional Details</label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Enter any additional details about this adjustment..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6"> {/* Responsive padding for card */}
            <CardHeader className="p-0 pb-4"> {/* Adjusted padding */}
              <CardTitle className="text-lg sm:text-xl">Add Products</CardTitle> {/* Responsive text size */}
            </CardHeader>
            <CardContent className="p-0"> {/* Adjusted padding */}
              <div className="relative">
                <Input
                  placeholder="Search by product name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2"> {/* Centered loading spinner */}
                    <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
                  </div>
                )}
                {products.length > 0 && (
                  <div className="absolute z-10 w-full border rounded-md bg-white mt-1 max-h-48 overflow-auto shadow-lg">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => addProduct(p)}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center"> {/* Responsive layout for product item */}
                          <div>
                            <div className="font-medium">
                              {p.code} - {p.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {p.category} {p.brand && `• ${p.brand}`}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 sm:mt-0">Stock: {p.current_stock}</div> {/* Margin top on small screens */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6"> {/* Responsive padding for card */}
            <CardHeader className="p-0 pb-4"> {/* Adjusted padding */}
              <CardTitle className="text-lg sm:text-xl">Adjustment Items ({adjustmentItems.length})</CardTitle> {/* Responsive text size */}
            </CardHeader>
            <CardContent className="p-0"> {/* Adjusted padding */}
              {adjustmentItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                    <X className="w-full h-full" />
                  </div>
                  <p>No products in this adjustment</p>
                  <p className="text-sm">Search and add products above</p>
                </div>
              ) : (
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
                        <th className="p-3 border-b text-left whitespace-nowrap">New Stock</th>
                        <th className="p-3 border-b text-left whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustmentItems.map((item, idx) => (
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
                            <span
                              className={`font-medium ${
                                calculateNewStock(item) !== item.current_stock
                                  ? item.type === "increase"
                                    ? "text-green-600"
                                    : "text-red-600"
                                  : ""
                              }`}
                            >
                              {calculateNewStock(item)}
                            </span>
                          </td>
                          <td className="p-3 border-b whitespace-nowrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(idx)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6"> {/* Responsive button layout and margin-top */}
            <Link href="/adjustment/all-adjustments" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Link href={`/adjustment/all-adjustments/${adjustment.id}`} className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            <Button type="submit" disabled={loading || adjustmentItems.length === 0} className="w-full sm:w-auto min-w-32">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <HiAdjustments className="w-4 h-4 mr-2" />
                  Update Adjustment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
