"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Trash2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showSuccess, showError, showWarning } from "@/lib/toast"
import Link from "next/link"

type Warehouse = {
  id: number
  name: string
}

type Product = {
  id: string
  code: string
  name: string
  current_stock: number
  cost: number
}

type TransferItem = {
  product_id: string
  code: string
  name: string
  current_stock: number
  qty: number
  net_unit_cost: number
  discount: number
  tax: number
  subtotal: number
}

export default function CreateTransferPage() {
  const router = useRouter()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [fromWarehouseId, setFromWarehouseId] = useState("")
  const [toWarehouseId, setToWarehouseId] = useState("")
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [orderTax, setOrderTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [notes, setNotes] = useState("")
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // Fetch warehouses on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error } = await supabase.from("warehouses").select("*").order("name")

      if (data && !error) {
        setWarehouses(data)
      } else {
        showError("Error loading warehouses")
      }
    }

    fetchWarehouses()
  }, [])

  // Search products
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
    if (transferItems.some((item) => item.product_id === product.id)) {
      showWarning("Product already added to transfer")
      return
    }

    const newItem: TransferItem = {
      product_id: product.id,
      code: product.code,
      name: product.name,
      current_stock: product.current_stock,
      qty: 1,
      net_unit_cost: product.cost,
      discount: 0,
      tax: 0,
      subtotal: product.cost,
    }

    setTransferItems([...transferItems, newItem])
    setSearch("")
    setProducts([])
  }

  const updateItem = (idx: number, field: keyof TransferItem, value: any) => {
    setTransferItems((items) =>
      items.map((item, i) => {
        if (i === idx) {
          const updatedItem = { ...item, [field]: value }
          // Recalculate subtotal when qty, cost, discount, or tax changes
          if (["qty", "net_unit_cost", "discount", "tax"].includes(field)) {
            const qty = field === "qty" ? value : updatedItem.qty
            const cost = field === "net_unit_cost" ? value : updatedItem.net_unit_cost
            const discount = field === "discount" ? value : updatedItem.discount
            const tax = field === "tax" ? value : updatedItem.tax
            updatedItem.subtotal = qty * cost - discount + tax
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const removeItem = (idx: number) => {
    setTransferItems((items) => items.filter((_, i) => i !== idx))
  }

  const calculateGrandTotal = () => {
    const itemsTotal = transferItems.reduce((sum, item) => sum + item.subtotal, 0)
    return itemsTotal + orderTax + shipping - discount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromWarehouseId) {
      showError("Please select a source warehouse")
      return
    }

    if (!toWarehouseId) {
      showError("Please select a destination warehouse")
      return
    }

    if (fromWarehouseId === toWarehouseId) {
      showError("Source and destination warehouses cannot be the same")
      return
    }

    if (transferItems.length === 0) {
      showError("Please add at least one product to transfer")
      return
    }

    setLoading(true)

    try {
      // Create the transfer record
      const { data: transfer, error: transferError } = await supabase
        .from("transfers")
        .insert([
          {
            date: new Date(date).toISOString(),
            from_warehouse_id: Number.parseInt(fromWarehouseId),
            to_warehouse_id: Number.parseInt(toWarehouseId),
            order_tax: orderTax,
            discount: discount,
            shipping: shipping,
            grand_total: calculateGrandTotal(),
            notes,
            details,
          },
        ])
        .select()
        .single()

      if (transferError) {
        throw transferError
      }

      // Create transfer items
      const items = transferItems.map((item) => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        qty: item.qty,
        net_unit_cost: item.net_unit_cost,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal,
      }))

      const { error: itemsError } = await supabase.from("transfer_items").insert(items)

      if (itemsError) {
        throw itemsError
      }

      showSuccess("Transfer created successfully!")
      router.push("/transfers")
    } catch (error) {
      console.error("Error creating transfer:", error)
      showError("Error creating transfer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/transfer/all-transfers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Transfers
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create Transfer</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Date *</label>
                  <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">From Warehouse *</label>
                  <Select value={fromWarehouseId} onValueChange={setFromWarehouseId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Warehouse" />
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

                <div>
                  <label className="block mb-2 text-sm font-medium">To Warehouse *</label>
                  <Select value={toWarehouseId} onValueChange={setToWarehouseId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Warehouse" />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                  <Input
                    placeholder="Scan/Search Product by code or name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
                            <div className="text-sm text-gray-500">Cost: ${p.cost}</div>
                          </div>
                          <div className="text-sm text-gray-500">Stock: {p.current_stock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer Items</CardTitle>
            </CardHeader>
            <CardContent>
              {transferItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-gray-400 mb-4">No data Available</div>
                  <p className="text-sm">Search and add products above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>#</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Net Unit Cost</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferItems.map((item, idx) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.code}</div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.net_unit_cost}
                              onChange={(e) => updateItem(idx, "net_unit_cost", Number(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>{item.current_stock}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax}
                              onChange={(e) => updateItem(idx, "tax", Number(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(idx)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between">
                        <span>Order Tax</span>
                        <span>{((orderTax / calculateGrandTotal()) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>${discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>${shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total</span>
                        <span>${calculateGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <label className="block mb-2 text-sm font-medium">Order Tax</label>
                <div className="flex items-center">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={orderTax}
                    onChange={(e) => setOrderTax(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="ml-2 text-gray-500">$</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <label className="block mb-2 text-sm font-medium">Discount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <label className="block mb-2 text-sm font-medium">Shipping</label>
                <div className="flex items-center">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="ml-2 text-gray-500">$</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <label className="block mb-2 text-sm font-medium">Please provide any details</label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide any details"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <label className="block mb-2 text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes here..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/transfers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || transferItems.length === 0}
              className="min-w-32 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
