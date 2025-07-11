"use client";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types from create-transfer ---
type Product = {
  id: string;
  code: string;
  name: string;
  current_stock: number;
  cost: number;
};

type QuotationItem = {
  product_id: string;
  code: string;
  name: string;
  current_stock: number;
  qty: number;
  net_unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
};

export default function AddQuotationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 19),
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

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) {
      setProducts([]);
      return;
    }
    const searchProducts = async () => {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, current_stock, cost")
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`)
        .limit(10);
      if (data && !error) {
        setProducts(data);
      }
      setSearchLoading(false);
    };
    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const addProduct = (product: Product) => {
    if (quotationItems.some((item) => item.product_id === product.id)) {
      return;
    }
    const newItem: QuotationItem = {
      product_id: product.id,
      code: product.code,
      name: product.name,
      current_stock: product.current_stock,
      qty: 1,
      net_unit_price: product.cost,
      discount: 0,
      tax: 0,
      subtotal: product.cost,
    };
    setQuotationItems([...quotationItems, newItem]);
    setSearch("");
    setProducts([]);
  };

  const updateItem = (idx: number, field: keyof QuotationItem, value: any) => {
    setQuotationItems((items) =>
      items.map((item, i) => {
        if (i === idx) {
          const updatedItem = { ...item, [field]: value };
          if (["qty", "net_unit_price", "discount", "tax"].includes(field)) {
            const qty = field === "qty" ? value : updatedItem.qty;
            const price = field === "net_unit_price" ? value : updatedItem.net_unit_price;
            const discount = field === "discount" ? value : updatedItem.discount;
            const tax = field === "tax" ? value : updatedItem.tax;
            updatedItem.subtotal = qty * price - discount + tax;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeItem = (idx: number) => {
    setQuotationItems((items) => items.filter((_, i) => i !== idx));
  };

  const subtotal = quotationItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderTaxAmount = (subtotal * Number(form.orderTax)) / 100;
  const discountAmount =
    form.discountType === "Percent"
      ? (subtotal * Number(form.discount)) / 100
      : Number(form.discount);
  const shippingAmount = Number(form.shipping);
  const grand_total = subtotal + orderTaxAmount + shippingAmount - discountAmount;

  useEffect(() => {
    setForm((prev) => ({ ...prev, grand_total: grand_total }));
  }, [subtotal, form.orderTax, form.discount, form.discountType, form.shipping]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
    const now = new Date();
    const ref = `QT_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}${String(now.getSeconds()).padStart(2,"0")}`;
    const { error } = await supabase.from("quotations").insert([
      {
        date: form.date,
        ref: ref,
        customer: form.customer,
        warehouse: form.warehouse,
        grand_total: form.grand_total,
      },
    ]);
    setLoading(false);
    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Quotation created!");
      setForm({
        date: new Date().toISOString().slice(0, 19),
        customer: "",
        warehouse: "",
        orderTax: 0,
        discount: 0,
        discountType: "Fixed",
        shipping: 0,
        details: "",
        grand_total: 0,
      });
      setQuotationItems([]);
    }
    router.push('/quotations/all-quotations')
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Add Quotation</h1>
      <Separator className="my-4" />
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <CardHeader>
            <CardTitle>Add Quotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="datetime-local" name="date" value={form.date} onChange={handleChange} />
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

            {/* Product Search & Table (dynamic, from create-transfer) */}
            <div className="bg-muted rounded-md p-4">
              <div className="relative mb-4">
                <div className="flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                  <Input
                    placeholder="Scan/Search Product by code or name"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10"
                  />
                  {searchLoading && (
                    <div className="absolute right-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    </div>
                  )}
                </div>
                {products.length > 0 && (
                  <div className="absolute z-10 w-full border rounded-md bg-white mt-1 max-h-48 overflow-auto shadow-lg">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => addProduct(p)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {p.code} - {p.name}
                            </div>
                            <div className="text-sm text-gray-500">Price: ${p.cost}</div>
                          </div>
                          <div className="text-sm text-gray-500">Stock: {p.current_stock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                    {quotationItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center">No data Available</td>
                      </tr>
                    ) : (
                      quotationItems.map((item, idx) => (
                        <tr key={item.product_id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.code}</div>
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.net_unit_price}
                              onChange={e => updateItem(idx, "net_unit_price", Number(e.target.value))}
                              className="w-24"
                            />
                          </td>
                          <td>{item.current_stock}</td>
                          <td>
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={e => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                              className="w-20"
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount}
                              onChange={e => updateItem(idx, "discount", Number(e.target.value))}
                              className="w-24"
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax}
                              onChange={e => updateItem(idx, "tax", Number(e.target.value))}
                              className="w-24"
                            />
                          </td>
                          <td>${item.subtotal.toFixed(2)}</td>
                          <td>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-end mt-4 space-y-1">
                <div>Order Tax: ${orderTaxAmount.toFixed(2)} ({form.orderTax}%)</div>
                <div>Discount: {form.discountType === "Percent"
                  ? `${form.discount}%`
                  : `$${Number(form.discount).toFixed(2)}`}</div>
                <div>Shipping: ${shippingAmount.toFixed(2)}</div>
                <div><b>Grand Total: ${grand_total.toFixed(2)}</b></div>
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
                </div>
              </div>
            </div>
            <div>
              <Label>Details</Label>
              <Textarea name="details" value={form.details} onChange={handleChange} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-end gap-2">
            {message && <div className="text-sm text-red-500 mb-2">{message}</div>}
            <Button type="submit" disabled={loading} className="w-40">
              {loading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              Create Quotation
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}