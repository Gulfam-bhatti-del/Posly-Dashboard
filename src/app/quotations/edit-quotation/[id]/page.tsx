"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState({
    date: "",
    ref: "",
    customer: "",
    warehouse: "",
    orderTax: 0,
    discount: 0,
    discountType: "Fixed",
    shipping: 0,
    details: "",
    grand_total: 0,
  });

  const [customers, setCustomers] = useState([{ id: "1", name: "Customer A" }, { id: "2", name: "Customer B" }]);
  const [warehouses, setWarehouses] = useState([{ id: "1", name: "Warehouse X" }, { id: "2", name: "Warehouse Y" }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [subtotal, setSubtotal] = useState(0); // Replace with real subtotal logic

  // Fetch quotation data
  useEffect(() => {
    async function fetchQuotation() {
      setLoading(true);
      const { data, error } = await supabase.from("quotations").select("*").eq("id", id).single();
      setLoading(false);
      if (error) {
        setMessage("Error fetching quotation: " + error.message);
      } else if (data) {
        setForm({
          date: data.date || "",
          ref: data.ref || "",
          customer: data.customer || "",
          warehouse: data.warehouse || "",
          orderTax: data.orderTax || 0,
          discount: data.discount || 0,
          discountType: data.discountType || "Fixed",
          shipping: data.shipping || 0,
          details: data.details || "",
          grand_total: data.grand_total || 0,
        });
        // setSubtotal(data.subtotal || 100); // If you store subtotal
      }
    }
    if (id) fetchQuotation();
  }, [id]);

  // Calculate grand total
  useEffect(() => {
    let orderTaxAmount = (subtotal * Number(form.orderTax)) / 100;
    let discountAmount =
      form.discountType === "Percent"
        ? (subtotal * Number(form.discount)) / 100
        : Number(form.discount);
    let shippingAmount = Number(form.shipping);
    let grand_total = subtotal + orderTaxAmount + shippingAmount - discountAmount;
    setForm((prev) => ({ ...prev, grand_total: grand_total }));
  }, [form.orderTax, form.discount, form.discountType, form.shipping, subtotal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.from("quotations").update({
      date: form.date,
      ref: form.ref,
      customer: form.customer,
      warehouse: form.warehouse,
      grand_total: form.grand_total,
    }).eq("id", id);
    setLoading(false);
    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Quotation updated!");
      router.push("/quotations/all-quotations");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Edit Quotation</h1>
      <Separator className="my-4" />
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <CardHeader>
            <CardTitle>Edit Quotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="datetime-local" name="date" value={form.date} onChange={handleChange} />
              </div>
              <div>
                <Label>Ref</Label>
                <Input name="ref" value={form.ref} onChange={handleChange} />
              </div>
              <div>
                <Label>Customer *</Label>
                <Select value={form.customer} onValueChange={v => handleSelect("customer", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Warehouse *</Label>
                <Select value={form.warehouse} onValueChange={v => handleSelect("warehouse", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Search & Table (expand as needed) */}
            <div className="bg-muted rounded-md p-4">
              <Input placeholder="Scan/Search Product by code or name" disabled />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>Net Unit Price</th>
                      <th>Current Stock</th>
                      <th>Qty</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Subtotal</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={9} className="text-center">No data Available</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-end mt-4 space-y-1">
                <div>Order Tax: ${((subtotal * Number(form.orderTax)) / 100).toFixed(2)} ({form.orderTax}%)</div>
                <div>Discount: {form.discountType === "Percent"
                  ? `${form.discount}%`
                  : `$${Number(form.discount).toFixed(2)}`}</div>
                <div>Shipping: ${Number(form.shipping).toFixed(2)}</div>
                <div><b>Grand Total: ${Number(form.grand_total).toFixed(2)}</b></div>
              </div>
            </div>

            {/* Order Tax, Discount, Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Order Tax</Label>
                <div className="flex items-center">
                  <Input name="orderTax" value={form.orderTax} onChange={handleChange} />
                  <span className="ml-2">%</span>
                </div>
              </div>
              <div>
                <Label>Discount</Label>
                <div className="flex items-center">
                  <Input name="discount" value={form.discount} onChange={handleChange} />
                  <Select value={form.discountType} onValueChange={v => handleSelect("discountType", v)}>
                    <SelectTrigger className="ml-2 w-20">
                      <SelectValue placeholder="Fixed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="Percent">Percent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Shipping</Label>
                <div className="flex items-center">
                  <Input name="shipping" value={form.shipping} onChange={handleChange} />
                  <span className="ml-2">$</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <Label>Please provide any details</Label>
              <Textarea name="details" value={form.details} onChange={handleChange} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {loading ? "Updating..." : "Update"}
            </Button>
            {message && <span className="ml-4 text-green-600">{message}</span>}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}