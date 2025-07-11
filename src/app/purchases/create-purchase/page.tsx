"use client";
import { useState, useEffect } from "react";
import type React from "react";

import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ToastContainer, toast, Bounce } from "react-toastify";

interface purchases {
  id: string;
  name: string;
  price: number;
  stock: number;
  qty: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export default function AddpurchasePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 19),
    ref: "",
    supplier: "",
    warehouse: "",
    orderTax: 0,
    discount: 0,
    discountType: "Fixed",
    shipping: 0,
    details: "",
    grand_total: 0,
    paid: 0,
    due: 0,
    payment_status: "Due",
  });

  const [products, setProducts] = useState<purchases[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [suppliers] = useState([
    { id: "1", name: "Corwin-Pfeffer" },
    { id: "2", name: "Schulist-Hickle" },
    { id: "3", name: "Tech Solutions Inc" },
  ]);

  const [warehouses] = useState([
    { id: "1", name: "Warehouse X" },
    { id: "2", name: "Warehouse Y" },
    { id: "3", name: "Main Storage" },
  ]);

  const subtotal = products.reduce((sum, product) => sum + product.subtotal, 0);

  useEffect(() => {
    const orderTaxAmount = (subtotal * Number(form.orderTax)) / 100;
    const discountAmount =
      form.discountType === "Percent"
        ? (subtotal * Number(form.discount)) / 100
        : Number(form.discount);
    const shippingAmount = Number(form.shipping);
    const grand_total =
      subtotal + orderTaxAmount + shippingAmount - discountAmount;
    const due = grand_total - Number(form.paid);

    setForm((prev) => ({
      ...prev,
      grand_total: grand_total,
      due: due,
    }));
  }, [
    form.orderTax,
    form.discount,
    form.discountType,
    form.shipping,
    form.paid,
    subtotal,
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "orderTax" ||
        name === "discount" ||
        name === "shipping" ||
        name === "paid"
          ? Number(value)
          : value,
    }));
  };

  const handleSelect = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.from("purchases").insert([
        {
          date: form.date,
          ref: form.ref,
          supplier: form.supplier,
          warehouse: form.warehouse,
          subtotal: subtotal,
          order_tax: form.orderTax,
          discount: form.discount,
          discount_type: form.discountType,
          shipping: form.shipping,
          grand_total: form.grand_total,
          paid: form.paid,
          due: form.due,
          payment_status: form.payment_status,
          details: form.details,
        },
      ]);

      // REACT TOAST ERROR
      if (error) {
        toast.error(error.message);
        return setMessage(error.message);
      } else {
        toast.success("purchase created successfully!");
      }

      setForm({
        date: new Date().toISOString().slice(0, 19),
        ref: "",
        supplier: "",
        warehouse: "",
        orderTax: 0,
        discount: 0,
        discountType: "Fixed",
        shipping: 0,
        details: "",
        grand_total: 0,
        paid: 0,
        due: 0,
        payment_status: "Due",
      });
      setProducts([]);

      setTimeout(() => {
        setMessage("Redirecting to purchases list...");
      }, 1000);
    } catch (error) {
      setMessage("Error creating purchase. Please try again.");
    }

    setLoading(false);

    router.push('/purchases/all-purchases')
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Add purchase</h1>
      <p className="text-muted-foreground mb-6">
        Create a new purchase order for your inventory
      </p>
      <Separator className="my-4" />

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Date *</Label>
                <Input
                  type="datetime-local"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Reference *</Label>
                <Input
                  name="ref"
                  value={form.ref}
                  onChange={handleChange}
                  placeholder="PO-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">supplier *</Label>
                <Select
                  value={form.supplier}
                  onValueChange={(v) => handleSelect("supplier", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Warehouse *</Label>
                <Select
                  value={form.warehouse}
                  onValueChange={(v) => handleSelect("warehouse", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.name}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search products by name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2 pt-4 border-t">
                <div className="text-sm">
                  Subtotal:{" "}
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  Order Tax:{" "}
                  <span className="font-medium">
                    ${((subtotal * Number(form.orderTax)) / 100).toFixed(2)} (
                    {form.orderTax}%)
                  </span>
                </div>
                <div className="text-sm">
                  Discount:{" "}
                  <span className="font-medium">
                    {form.discountType === "Percent"
                      ? `${form.discount}% ($${(
                          (subtotal * Number(form.discount)) /
                          100
                        ).toFixed(2)})`
                      : `$${Number(form.discount).toFixed(2)}`}
                  </span>
                </div>
                <div className="text-sm">
                  Shipping:{" "}
                  <span className="font-medium">
                    ${Number(form.shipping).toFixed(2)}
                  </span>
                </div>
                <div className="text-lg font-bold">
                  Grand Total:{" "}
                  <span className="text-primary">
                    ${Number(form.grand_total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Order Tax (%)</Label>
                <Input
                  type="number"
                  name="orderTax"
                  value={form.orderTax}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Discount</Label>
                <div className="flex items-center mt-1">
                  <Input
                    type="number"
                    name="discount"
                    value={form.discount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <Select
                    value={form.discountType}
                    onValueChange={(v) => handleSelect("discountType", v)}
                  >
                    <SelectTrigger className="ml-2 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">$</SelectItem>
                      <SelectItem value="Percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Shipping ($)</Label>
                <Input
                  type="number"
                  name="shipping"
                  value={form.shipping}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Payment Status</Label>
                <Select
                  value={form.payment_status}
                  onValueChange={(v) => handleSelect("payment_status", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Due">Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Paid Amount ($)</Label>
                <Input
                  type="number"
                  name="paid"
                  value={form.paid}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Due Amount ($)</Label>
                <Input
                  value={form.due.toFixed(2)}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <Label className="text-sm font-medium">Additional Details</Label>
              <Textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                placeholder="Enter any additional notes or details about this purchase..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={
                  loading || !form.ref || !form.supplier || !form.warehouse
                }
                onClick={() => toast}
              >
                {loading ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {loading ? "Creating purchase..." : "Create purchase"}
              </Button>
              <ToastContainer />
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </div>
            {message && (
              <span
                className={`text-sm ${
                  message.includes("Error") ? "text-red-600" : "text-green-600"
                }`}
              >
                {message}
              </span>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

// "use client"
//  import React from 'react';

//   import { ToastContainer, toast } from 'react-toastify';

//   function App(){
//     const notify = () => toast("Wow so easy!");

//     return (
//       <div>
//         <button onClick={notify}>Notify!</button>
//         <ToastContainer />
//       </div>
//     );
//   }

//   export default App;
