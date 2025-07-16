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
import { ArrowLeft, Trash2, Search, Loader2 } from "lucide-react"
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
        toast.error("Error loading warehouses")
        console.error("Error loading warehouses:", error)
      }
    }
    fetchWarehouses()
  }, [])

  // Search products with alternative approach
  useEffect(() => {
    if (search.length < 2) {
      setProducts([])
      return
    }

    const searchProducts = async () => {
      setSearchLoading(true)
      try {
        // Use separate queries and combine results to avoid OR issues
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
        toast.error("Error searching products")
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

    // Enhanced validation
    if (!date || date === "") {
      toast.error("Please select a date")
      return
    }
    if (!fromWarehouseId || fromWarehouseId === "") {
      toast.error("Please select a source warehouse")
      return
    }
    if (!toWarehouseId || toWarehouseId === "") {
      toast.error("Please select a destination warehouse")
      return
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error("Source and destination warehouses cannot be the same")
      return
    }
    if (transferItems.length === 0) {
      toast.error("Please add at least one product to transfer")
      return
    }

    // Validate warehouse IDs are valid numbers
    const fromWarehouseIdNum = Number.parseInt(fromWarehouseId, 10)
    const toWarehouseIdNum = Number.parseInt(toWarehouseId, 10)

    if (isNaN(fromWarehouseIdNum) || isNaN(toWarehouseIdNum)) {
      toast.error("Invalid warehouse selection")
      return
    }

    setLoading(true)
    try {
      // Create the transfer record with all required fields
      const transferData = {
        date: new Date(date).toISOString(), // Ensure date is always included
        from_warehouse_id: fromWarehouseIdNum,
        to_warehouse_id: toWarehouseIdNum,
        total_products: transferItems.length,
        order_tax: Number(orderTax) || 0,
        discount: Number(discount) || 0,
        shipping: Number(shipping) || 0,
        grand_total: Number(calculateGrandTotal()) || 0,
        notes: notes || null,
        details: details || null,
        status: "pending",
        ref: null,
      }

      console.log("Creating transfer with data:", transferData)

      const { data: transfer, error: transferError } = await supabase
        .from("transfers")
        .insert([transferData])
        .select()
        .single()

      if (transferError) {
        console.error("Transfer creation error:", transferError)
        throw transferError
      }

      console.log("Transfer created successfully:", transfer)

      // Create transfer items
      const items = transferItems.map((item) => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        qty: Number(item.qty) || 1,
        net_unit_cost: Number(item.net_unit_cost) || 0,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0,
        subtotal: Number(item.subtotal) || 0,
      }))

      console.log("Creating transfer items:", items)

      const { error: itemsError } = await supabase.from("transfer_items").insert(items)

      if (itemsError) {
        console.error("Transfer items creation error:", itemsError)
        throw itemsError
      }

      toast.success("Transfer created successfully!")
      router.push("/transfers")
    } catch (error: any) {
      console.error("Error creating transfer:", error)

      // More specific error handling
      if (error.code === "42804") {
        toast.error("Database constraint error. The RLS policy needs to be fixed.")
      } else if (error.code === "23503") {
        toast.error("Invalid reference. Please ensure all selected items exist.")
      } else if (error.code === "42501") {
        toast.error("Permission denied. Please check your access rights.")
      } else {
        toast.error("Error creating transfer: " + (error.message || "Unknown error"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-center" />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link href="/transfer/all-transfers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Transfers
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Create Transfer</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 sm:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg sm:text-xl">Transfer Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Date *</label>
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">From Warehouse *</label>
                  <Select value={fromWarehouseId} onValueChange={setFromWarehouseId} required>
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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

          <Card className="p-4 sm:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg sm:text-xl">Add Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <div className="flex items-center">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Scan/Search Product by code or name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div>
                            <div className="font-medium">
                              {p.code} - {p.name}
                            </div>
                            <div className="text-sm text-gray-500">Cost: ${p.cost}</div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 sm:mt-0">Stock: {p.current_stock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg sm:text-xl">Transfer Items ({transferItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transferItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-gray-400 mb-4">No data Available</div>
                  <p className="text-sm">Search and add products above</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="whitespace-nowrap">#</TableHead>
                        <TableHead className="whitespace-nowrap">Product Name</TableHead>
                        <TableHead className="whitespace-nowrap">Net Unit Cost</TableHead>
                        <TableHead className="whitespace-nowrap">Current Stock</TableHead>
                        <TableHead className="whitespace-nowrap">Qty</TableHead>
                        <TableHead className="whitespace-nowrap">Discount</TableHead>
                        <TableHead className="whitespace-nowrap">Tax</TableHead>
                        <TableHead className="whitespace-nowrap">Subtotal</TableHead>
                        <TableHead className="whitespace-nowrap">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferItems.map((item, idx) => (
                        <TableRow key={item.product_id}>
                          <TableCell className="whitespace-nowrap">{idx + 1}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.code}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.net_unit_cost}
                              onChange={(e) => updateItem(idx, "net_unit_cost", Number(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.current_stock}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax}
                              onChange={(e) => updateItem(idx, "tax", Number(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
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
                    <div className="w-full sm:w-80 space-y-2 p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between">
                        <span>Order Tax</span>
                        <span>${orderTax.toFixed(2)}</span>
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
            <Card className="p-4 sm:p-6">
              <CardContent className="p-0">
                <label className="block mb-2 text-sm font-medium">Order Tax ($)</label>
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
            <Card className="p-4 sm:p-6">
              <CardContent className="p-0">
                <label className="block mb-2 text-sm font-medium">Discount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full"
                />
              </CardContent>
            </Card>
            <Card className="p-4 sm:p-6">
              <CardContent className="p-0">
                <label className="block mb-2 text-sm font-medium">Shipping ($)</label>
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
            <Card className="p-4 sm:p-6">
              <CardContent className="p-0">
                <label className="block mb-2 text-sm font-medium">Please provide any details</label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide any details"
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>
            <Card className="p-4 sm:p-6">
              <CardContent className="p-0">
                <label className="block mb-2 text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes here..."
                  rows={4}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
            <Link href="/transfer/all-transfers" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || transferItems.length === 0}
              className="min-w-32 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
