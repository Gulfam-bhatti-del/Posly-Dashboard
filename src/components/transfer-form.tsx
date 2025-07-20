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
import { ArrowLeft, Trash2, Search, Loader2, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
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

export default function TransferForm() {
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
      try {
        const { data, error } = await supabase.from("warehouses").select("id, name").order("name")
        if (error) throw error
        setWarehouses(data || [])
      } catch (error) {
        console.error("Error loading warehouses:", error)
        toast.error("Failed to load warehouses")
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
      try {
        // Search by name and code separately, then combine
        const [nameResults, codeResults] = await Promise.all([
          supabase.from("products").select("id, code, name, current_stock, cost").ilike("name", `%${search}%`).limit(5),
          supabase.from("products").select("id, code, name, current_stock, cost").ilike("code", `%${search}%`).limit(5),
        ])

        // Combine and deduplicate results
        const combinedResults = [...(nameResults.data || []), ...(codeResults.data || [])]
          .filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))
          .slice(0, 10)

        setProducts(combinedResults)
      } catch (error) {
        console.error("Search error:", error)
        toast.error("Failed to search products")
      } finally {
        setSearchLoading(false)
      }
    }

    const timeoutId = setTimeout(searchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  const addProduct = (product: Product) => {
    if (transferItems.some((item) => item.product_id === product.id)) {
      toast.warn("Product already added to transfer")
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

          // Recalculate subtotal when relevant fields change
          if (["qty", "net_unit_cost", "discount", "tax"].includes(field)) {
            const qty = field === "qty" ? Number(value) : updatedItem.qty
            const cost = field === "net_unit_cost" ? Number(value) : updatedItem.net_unit_cost
            const discount = field === "discount" ? Number(value) : updatedItem.discount
            const tax = field === "tax" ? Number(value) : updatedItem.tax

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

  const validateForm = () => {
    if (!date) {
      toast.error("Please select a date")
      return false
    }
    if (!fromWarehouseId) {
      toast.error("Please select a source warehouse")
      return false
    }
    if (!toWarehouseId) {
      toast.error("Please select a destination warehouse")
      return false
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error("Source and destination warehouses must be different")
      return false
    }
    if (transferItems.length === 0) {
      toast.error("Please add at least one product")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      // Prepare transfer data
      const transferData = {
        date: new Date(date).toISOString(),
        from_warehouse_id: Number.parseInt(fromWarehouseId),
        to_warehouse_id: Number.parseInt(toWarehouseId),
        total_products: transferItems.length,
        order_tax: Number(orderTax) || 0,
        discount: Number(discount) || 0,
        shipping: Number(shipping) || 0,
        grand_total: Number(calculateGrandTotal()),
        notes: notes || null,
        details: details || null,
        status: "pending",
      }

      console.log("Creating transfer:", transferData)

      // Create transfer
      const { data: transfer, error: transferError } = await supabase
        .from("transfers")
        .insert([transferData])
        .select()
        .single()

      if (transferError) throw transferError

      // Prepare transfer items
      const items = transferItems.map((item) => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        qty: Number(item.qty),
        net_unit_cost: Number(item.net_unit_cost),
        discount: Number(item.discount),
        tax: Number(item.tax),
        subtotal: Number(item.subtotal),
      }))

      // Create transfer items
      const { error: itemsError } = await supabase.from("transfer_items").insert(items)

      if (itemsError) throw itemsError

      toast.success("Transfer created successfully!")
      router.push("/transfer/all-transfers")
    } catch (error: any) {
      console.error("Error creating transfer:", error)
      toast.error(`Failed to create transfer: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/transfers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Transfers
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Transfer</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transfer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
                  <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Warehouse *</label>
                  <Select value={fromWarehouseId} onValueChange={setFromWarehouseId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Warehouse *</label>
                  <Select value={toWarehouseId} onValueChange={setToWarehouseId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter((w) => w.id.toString() !== fromWarehouseId)
                        .map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex items-center">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search products by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                  {searchLoading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Search Results */}
                {products.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => addProduct(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">
                              {product.code} - {product.name}
                            </div>
                            <div className="text-sm text-gray-500">Cost: ${product.cost}</div>
                          </div>
                          <div className="text-sm text-gray-500">Stock: {product.current_stock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transfer Items */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Items ({transferItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {transferItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-gray-400 mb-2">No products added</div>
                  <p className="text-sm">Search and add products above to continue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-24">Unit Cost</TableHead>
                          <TableHead className="w-20">Stock</TableHead>
                          <TableHead className="w-20">Qty</TableHead>
                          <TableHead className="w-24">Discount</TableHead>
                          <TableHead className="w-24">Tax</TableHead>
                          <TableHead className="w-24">Subtotal</TableHead>
                          <TableHead className="w-16">Action</TableHead>
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
                                onChange={(e) => updateItem(idx, "net_unit_cost", e.target.value)}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell className="text-center">{item.current_stock}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.discount}
                                onChange={(e) => updateItem(idx, "discount", e.target.value)}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.tax}
                                onChange={(e) => updateItem(idx, "tax", e.target.value)}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell className="font-medium">${item.subtotal.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(idx)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Summary */}
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Items Total:</span>
                        <span>${transferItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Order Tax:</span>
                        <span>${orderTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>${shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total:</span>
                        <span>${calculateGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Costs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderTax}
                  onChange={(e) => setOrderTax(Number(e.target.value))}
                  placeholder="0.00"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Discount</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  placeholder="0.00"
                />
              </CardContent>
            </Card>
          </div>

          {/* Notes and Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Enter transfer details..."
                  rows={4}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter additional notes..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/transfers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || transferItems.length === 0} className="min-w-32">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Transfer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
