"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useParams, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { Trash2 } from "lucide-react" // Import Trash2

// --- Types from create-transfer ---
type Product = {
  id: string
  code: string
  name: string
  current_stock: number
  cost: number
}

type QuotationItem = {
  product_id: string
  code: string
  name: string
  current_stock: number
  qty: number
  net_unit_price: number
  discount: number
  tax: number
  subtotal: number
}

export default function EditQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [form, setForm] = useState({
    date: "",
    ref: "",
    customer_id: "", // Keep as string for Select component value
    warehouse_id: "", // Keep as string for Select component value
    orderTax: 0,
    discount: 0,
    discountType: "Fixed",
    shipping: 0,
    details: "",
    grand_total: 0,
  })

  // Update customer ID type to number
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]) // Assuming warehouses still use string IDs
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]) // To store fetched items
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [subtotal, setSubtotal] = useState(0)

  // Fetch Customers and Warehouses
  useEffect(() => {
    async function fetchData() {
      // Fetch customers with id as number
      const { data: customersData, error: customersError } = await supabase.from("customers").select("id, full_name")
      if (customersData) {
        setCustomers(customersData.map((c) => ({ id: c.id, name: c.full_name }))) // Map full_name to name
      }
      if (customersError) console.error("Error fetching customers:", customersError)

      const { data: warehousesData, error: warehousesError } = await supabase.from("warehouses").select("id, name")
      if (warehousesData) setWarehouses(warehousesData) // Corrected setWarehouses
      if (warehousesError) console.error("Error fetching warehouses:", warehousesError)
    }
    fetchData()
  }, [])

  // Fetch quotation data
  useEffect(() => {
    async function fetchQuotation() {
      setLoading(true)
      const { data, error } = await supabase.from("quotations").select("*").eq("id", id).single()
      setLoading(false)
      if (error) {
        setMessage("Error fetching quotation: " + error.message)
      } else if (data) {
        setForm({
          date: data.date ? new Date(data.date).toISOString().slice(0, 19) : "", // Format date for datetime-local input
          ref: data.ref || "",
          customer_id: String(data.customer_id) || "", // Convert to string for Select component
          warehouse_id: data.warehouse_id || "", // Use warehouse_id
          orderTax: data.orderTax || 0,
          discount: data.discount || 0,
          discountType: data.discountType || "Fixed",
          shipping: data.shipping || 0,
          details: data.details || "",
          grand_total: data.grand_total || 0,
        })
        setQuotationItems(data.items || []) // Assuming items are stored as JSONB
        setSubtotal(data.items ? data.items.reduce((sum: number, item: QuotationItem) => sum + item.subtotal, 0) : 0)
      }
    }
    if (id) fetchQuotation()
  }, [id])

  // Calculate grand total
  useEffect(() => {
    const orderTaxAmount = (subtotal * Number(form.orderTax)) / 100
    const discountAmount =
      form.discountType === "Percent" ? (subtotal * Number(form.discount)) / 100 : Number(form.discount)
    const shippingAmount = Number(form.shipping)
    const grand_total = subtotal + orderTaxAmount + shippingAmount - discountAmount
    setForm((prev) => ({ ...prev, grand_total: grand_total }))
  }, [form.orderTax, form.discount, form.discountType, form.shipping, subtotal])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value })
  }

  const updateItem = (idx: number, field: keyof QuotationItem, value: any) => {
    setQuotationItems((items) =>
      items.map((item, i) => {
        if (i === idx) {
          const updatedItem = { ...item, [field]: value }
          if (["qty", "net_unit_price", "discount", "tax"].includes(field)) {
            const qty = field === "qty" ? value : updatedItem.qty
            const price = field === "net_unit_price" ? value : updatedItem.net_unit_price
            const discount = field === "discount" ? value : updatedItem.discount
            const tax = field === "tax" ? value : updatedItem.tax
            updatedItem.subtotal = qty * price - discount + tax
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const removeItem = (idx: number) => {
    setQuotationItems((items) => items.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    const currentSubtotal = quotationItems.reduce((sum, item) => sum + item.subtotal, 0)
    setSubtotal(currentSubtotal)
  }, [quotationItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    // Get customer and warehouse names from their IDs
    const customerName = customers.find((c) => c.id === Number(form.customer_id))?.name || ""
    const warehouseName = warehouses.find((w) => w.id === form.warehouse_id)?.name || ""

    const { error } = await supabase
      .from("quotations")
      .update({
        date: form.date,
        ref: form.ref,
        customer_id: Number(form.customer_id), // Convert to number for database
        customer: customerName,
        warehouse_id: form.warehouse_id,
        warehouse: warehouseName,
        orderTax: form.orderTax,
        discount: form.discount,
        discountType: form.discountType,
        shipping: form.shipping,
        details: form.details,
        grand_total: form.grand_total,
        items: quotationItems, // Update quotation items
      })
      .eq("id", id)
    setLoading(false)
    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Quotation updated!")
      router.push("/quotations/all-quotations")
    }
  }

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
                <Select value={form.customer_id} onValueChange={(v) => handleSelect("customer_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Warehouse *</Label>
                <Select value={form.warehouse_id} onValueChange={(v) => handleSelect("warehouse_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Search & Table */}
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
                    {quotationItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center">
                          No data Available
                        </td>
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
                              onChange={(e) => updateItem(idx, "net_unit_price", Number(e.target.value))}
                              className="w-24"
                            />
                          </td>
                          <td>{item.current_stock}</td>
                          <td>
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                              className="w-20"
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                              className="w-24"
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax}
                              onChange={(e) => updateItem(idx, "tax", Number(e.target.value))}
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
                <div>
                  Order Tax: ${((subtotal * Number(form.orderTax)) / 100).toFixed(2)} ({form.orderTax}%)
                </div>
                <div>
                  Discount:{" "}
                  {form.discountType === "Percent" ? `${form.discount}%` : `$${Number(form.discount).toFixed(2)}`}
                </div>
                <div>Shipping: ${Number(form.shipping).toFixed(2)}</div>
                <div>
                  <b>Grand Total: ${Number(form.grand_total).toFixed(2)}</b>
                </div>
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
                  <Select value={form.discountType} onValueChange={(v) => handleSelect("discountType", v)}>
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
  )
}
