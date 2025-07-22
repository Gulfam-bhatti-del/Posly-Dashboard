"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [form, setForm] = useState({
    date: "",
    ref: "",
    customer: "",
    warehouse: "",
    orderTax: 0,
    discount: 0,
    discountType: "Fixed", // This is a UI state, not directly from DB in your schema
    shipping: 0,
    details: "",
    grand_total: 0,
  })
  const [customers, setCustomers] = useState([
    { id: "1", name: "Customer A" },
    { id: "2", name: "Customer B" },
  ])
  const [warehouses, setWarehouses] = useState([
    { id: "1", name: "Warehouse X" },
    { id: "2", name: "Warehouse Y" },
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [subtotal] = useState(0)
  useEffect(() => {
    async function fetchQuotation() {
      setLoading(true)
      const { data, error } = await supabase.from("quotations").select("*").eq("id", id).single()
      setLoading(false)
      if (error) {
        setMessage("Error fetching quotation: " + error.message)
      } else if (data) {
        setForm({
          date: data.date || "",
          ref: data.ref || "",
          customer: data.customer || "",
          warehouse: data.warehouse || "",
          orderTax: data.order_tax || 0, // Updated field name
          discount: data.discount || 0, // Updated field name
          discountType: "Fixed", // Assuming default or derive if needed from DB
          shipping: data.shipping || 0, // Updated field name
          details: data.details || "",
          grand_total: data.grand_total || 0,
        })
      }
    }
    if (id) fetchQuotation()
  }, [id])
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    const { error } = await supabase
      .from("quotations")
      .update({
        date: form.date,
        ref: form.ref,
        customer: form.customer,
        warehouse: form.warehouse,
        order_tax: form.orderTax, // Added
        discount: form.discount, // Added
        shipping: form.shipping, // Added
        details: form.details, // Added (was missing in original update)
        grand_total: form.grand_total,
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
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Quotation</h1>
      <Separator className="my-4" />
      <form onSubmit={handleSubmit}>
        <Card className="p-4 sm:p-6 space-y-6">
          <CardContent className="p-0 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="datetime-local" name="date" value={form.date} onChange={handleChange} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Ref</Label>
                <Input name="ref" value={form.ref} onChange={handleChange} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={form.customer} onValueChange={(v) => handleSelect("customer", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Select value={form.warehouse} onValueChange={(v) => handleSelect("warehouse", v)}>
                  <SelectTrigger className="w-full">
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
            {/* Product Search & Table */}
            <div className="bg-muted rounded-md p-4">
              <Input placeholder="Scan/Search Product by code or name" disabled className="w-full" />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">#</th>
                      <th className="p-2">Product Name</th>
                      <th className="p-2">Net Unit Price</th>
                      <th className="p-2">Current Stock</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Discount</th>
                      <th className="p-2">Tax</th>
                      <th className="p-2">Subtotal</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={9} className="text-center p-4">
                        No data Available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-end mt-4 space-y-1 text-sm sm:text-base">
                <div>
                  Order Tax: $ {((subtotal * Number(form.orderTax)) / 100).toFixed(2)} ( {form.orderTax}%)
                </div>
                <div>
                  Discount:{" "}
                  {form.discountType === "Percent" ? `${form.discount}%` : `$${Number(form.discount).toFixed(2)}`}
                </div>
                <div>Shipping: ${Number(form.shipping).toFixed(2)}</div>
                <div className="font-bold">Grand Total: ${Number(form.grand_total).toFixed(2)}</div>
              </div>
            </div>
            {/* Order Tax, Discount, Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Order Tax</Label>
                <div className="flex items-center">
                  <Input name="orderTax" value={form.orderTax} onChange={handleChange} className="w-full" />
                  <span className="ml-2">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <div className="flex items-center gap-2">
                  <Input name="discount" value={form.discount} onChange={handleChange} className="flex-1" />
                  <Select value={form.discountType} onValueChange={(v) => handleSelect("discountType", v)}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Fixed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="Percent">Percent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Shipping</Label>
                <div className="flex items-center">
                  <Input name="shipping" value={form.shipping} onChange={handleChange} className="w-full" />
                  <span className="ml-2">$</span>
                </div>
              </div>
            </div>
            {/* Details */}
            <div className="space-y-2">
              <Label>Please provide any details</Label>
              <Textarea name="details" value={form.details} onChange={handleChange} className="w-full min-h-[100px]" />
            </div>
          </CardContent>
          <CardFooter className="p-0 pt-6">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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
