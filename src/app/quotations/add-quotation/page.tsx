"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"

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

export default function AddQuotationPage() {
  const router = useRouter()
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
  })
  const [customers, setCustomers] = useState([
    { id: "1", name: "Customer A" },
    { id: "2", name: "Customer B" },
  ])
  const [warehouses, setWarehouses] = useState([
    { id: "1", name: "Warehouse X" },
    { id: "2", name: "Warehouse Y" },
  ])
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (search.length < 2) {
      setProducts([])
      return
    }
    const searchProducts = async () => {
      setSearchLoading(true)
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, current_stock, cost")
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`)
        .limit(10)
      if (data && !error) {
        setProducts(data)
      }
      setSearchLoading(false)
    }
    const timeoutId = setTimeout(searchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  const addProduct = (product: Product) => {
    if (quotationItems.some((item) => item.product_id === product.id)) {
      return
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
    }
    setQuotationItems([...quotationItems, newItem])
    setSearch("")
    setProducts([])
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

  const subtotal = quotationItems.reduce((sum, item) => sum + item.subtotal, 0)
  const orderTaxAmount = (subtotal * Number(form.orderTax)) / 100
  const discountAmount =
    form.discountType === "Percent" ? (subtotal * Number(form.discount)) / 100 : Number(form.discount)
  const shippingAmount = Number(form.shipping)
  const grand_total = subtotal + orderTaxAmount + shippingAmount - discountAmount

  useEffect(() => {
    setForm((prev) => ({ ...prev, grand_total: grand_total }))
  }, [subtotal, form.orderTax, form.discount, form.discountType, form.shipping])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

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
    const now = new Date()
    const ref = `QT_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`
    const { error } = await supabase.from("quotations").insert([
      {
        date: form.date,
        ref: ref,
        customer: form.customer,
        warehouse: form.warehouse,
        order_tax: form.orderTax, // Added
        discount: form.discount, // Added
        shipping: form.shipping, // Added
        details: form.details, // Added
        grand_total: form.grand_total,
      },
    ])
    setLoading(false)
    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Quotation created!")
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
      })
      setQuotationItems([])
      router.push("/quotations/all-quotations")
    }
  }

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">Add Quotation</h1>
      <Separator className="my-2 sm:my-4" />
      <form onSubmit={handleSubmit}>
        <Card className="p-2 sm:p-6 space-y-4 sm:space-y-6">
          <CardContent className="space-y-3 sm:space-y-4 p-2 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="datetime-local"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label>Customer *</Label>
                <Select value={form.customer} onValueChange={(v) => handleSelect("customer", v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-sm">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Warehouse *</Label>
                <Select value={form.warehouse} onValueChange={(v) => handleSelect("warehouse", v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Choose Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.name} className="text-sm">
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Product Search & Table */}
            <div className="bg-muted rounded-md p-3 sm:p-4">
              <div className="relative mb-3 sm:mb-4">
                <div className="flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                  <Input
                    placeholder="Scan/Search Product by code or name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 text-sm"
                  />
                  {searchLoading && (
                    <div className="absolute right-3">
                      <Loader2 className="animate-spin w-4 h-4" />
                    </div>
                  )}
                </div>
                {products.length > 0 && (
                  <div className="absolute z-10 w-full border rounded-md bg-white mt-1 max-h-48 overflow-auto shadow-lg">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 text-sm"
                        onClick={() => addProduct(p)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {p.code} - {p.name}
                            </div>
                            <div className="text-xs text-gray-500">Price: ${p.cost}</div>
                          </div>
                          <div className="text-xs text-gray-500">Stock: {p.current_stock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 sm:mt-4 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-1 sm:p-2">#</th>
                      <th className="p-1 sm:p-2">Product</th>
                      <th className="p-1 sm:p-2">Price</th>
                      <th className="p-1 sm:p-2 hidden sm:table-cell">Stock</th>
                      <th className="p-1 sm:p-2">Qty</th>
                      <th className="p-1 sm:p-2">Subtotal</th>
                      <th className="p-1 sm:p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotationItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center p-2 text-sm">
                          No data Available
                        </td>
                      </tr>
                    ) : (
                      quotationItems.map((item, idx) => (
                        <tr key={item.product_id} className="border-t">
                          <td className="p-1 sm:p-2">{idx + 1}</td>
                          <td className="p-1 sm:p-2">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.code}</div>
                          </td>
                          <td className="p-1 sm:p-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.net_unit_price}
                              onChange={(e) => updateItem(idx, "net_unit_price", Number(e.target.value))}
                              className="w-16 sm:w-24 text-xs sm:text-sm"
                            />
                          </td>
                          <td className="p-1 sm:p-2 hidden sm:table-cell">{item.current_stock}</td>
                          <td className="p-1 sm:p-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                              className="w-12 sm:w-20 text-xs sm:text-sm"
                            />
                          </td>
                          <td className="p-1 sm:p-2">${item.subtotal.toFixed(2)}</td>
                          <td className="p-1 sm:p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-8 sm:w-8"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-end mt-3 sm:mt-4 space-y-1 text-sm">
                <div>
                  Order Tax: ${orderTaxAmount.toFixed(2)} ({form.orderTax}%)
                </div>
                <div>
                  Discount:{" "}
                  {form.discountType === "Percent" ? `${form.discount}%` : `$${Number(form.discount).toFixed(2)}`}
                </div>
                <div>Shipping: ${shippingAmount.toFixed(2)}</div>
                <div className="font-bold">Grand Total: ${grand_total.toFixed(2)}</div>
              </div>
            </div>
            {/* Order Tax, Discount, Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Order Tax</Label>
                <div className="flex items-center">
                  <Input name="orderTax" value={form.orderTax} onChange={handleChange} className="text-sm" />
                  <span className="ml-2 text-sm">%</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Discount</Label>
                <div className="flex items-center">
                  <Input name="discount" value={form.discount} onChange={handleChange} className="text-sm" />
                  <Select value={form.discountType} onValueChange={(v) => handleSelect("discountType", v)}>
                    <SelectTrigger className="ml-2 w-20 text-sm">
                      <SelectValue placeholder="Fixed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed" className="text-sm">
                        Fixed
                      </SelectItem>
                      <SelectItem value="Percent" className="text-sm">
                        Percent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Shipping</Label>
                <div className="flex items-center">
                  <Input name="shipping" value={form.shipping} onChange={handleChange} className="text-sm" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Details</Label>
              <Textarea name="details" value={form.details} onChange={handleChange} className="text-sm" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-end gap-2 p-4 sm:p-6">
            {message && <div className="text-xs sm:text-sm text-red-500">{message}</div>}
            <Button type="submit" disabled={loading} className="w-full sm:w-40">
              {loading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              Create Quotation
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
