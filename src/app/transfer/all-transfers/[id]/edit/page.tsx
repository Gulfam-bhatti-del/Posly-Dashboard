"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Trash2, Search, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast, ToastContainer } from "react-toastify"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

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
  id?: string // Optional for new items not yet in DB
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

type TransferDetail = {
  id: string
  ref: string
  date: string
  from_warehouse_id: number
  to_warehouse_id: number
  order_tax: number
  discount: number
  shipping: number
  grand_total: number
  notes: string | null
  details: string | null
  status: string
  total_products: number
}

export default function EditTransferForm() {
  const params = useParams()
  const router = useRouter()
  const transferId = params.id as string

  const [transfer, setTransfer] = useState<TransferDetail | null>(null)
  const [date, setDate] = useState("")
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
  const [loading, setLoading] = useState(false) // For form submission loading
  const [initialLoading, setInitialLoading] = useState(true) // For initial data fetch loading
  const [searchLoading, setSearchLoading] = useState(false) // For product search loading

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

  // Fetch transfer data when ID changes
  useEffect(() => {
    if (transferId) {
      fetchTransferData(transferId)
    }
  }, [transferId])

  // Search products with debouncing
  useEffect(() => {
    if (search.length < 2) {
      setProducts([])
      return
    }

    const searchProducts = async () => {
      setSearchLoading(true)
      try {
        const [nameResults, codeResults] = await Promise.all([
          supabase.from("products").select("id, code, name, current_stock, cost").ilike("name", `%${search}%`).limit(5),
          supabase.from("products").select("id, code, name, current_stock, cost").ilike("code", `%${search}%`).limit(5),
        ])

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

  const fetchTransferData = async (id: string) => {
    setInitialLoading(true)
    try {
      // Fetch transfer details
      const { data: transferData, error: transferError } = await supabase
        .from("transfers")
        .select("*")
        .eq("id", id)
        .single()

      if (transferError) {
        toast.error("Error loading transfer details. Redirecting...")
        console.error("Error fetching transfer:", transferError)
        router.push("/transfers")
        return
      }

      // Fetch transfer items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from("transfer_items")
        .select(
          `
          id,
          product_id,
          qty,
          net_unit_cost,
          discount,
          tax,
          subtotal,
          products (
            code,
            name,
            current_stock,
            cost
          )
        `,
        )
        .eq("transfer_id", id)

      if (itemsError) {
        toast.error("Error loading transfer items")
        console.error("Error fetching transfer items:", itemsError)
        return
      }

      setTransfer(transferData)
      setDate(new Date(transferData.date).toISOString().slice(0, 16))
      setFromWarehouseId(transferData.from_warehouse_id?.toString() || "")
      setToWarehouseId(transferData.to_warehouse_id?.toString() || "")
      setOrderTax(transferData.order_tax || 0)
      setDiscount(transferData.discount || 0)
      setShipping(transferData.shipping || 0)
      setNotes(transferData.notes || "")
      setDetails(transferData.details || "")

      // Transform items data
      const transformedItems =
        itemsData?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          code: item.products.code,
          name: item.products.name,
          current_stock: item.products.current_stock,
          qty: item.qty,
          net_unit_cost: item.net_unit_cost,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal,
        })) || []
      setTransferItems(transformedItems)
    } catch (error) {
      toast.error("Error loading transfer data. Please try again.")
      console.error("Error:", error)
      router.push("/transfers")
    } finally {
      setInitialLoading(false)
    }
  }

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
          // Recalculate subtotal when qty, cost, discount, or tax changes
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
      // Update the transfer record
      const { error: transferError } = await supabase
        .from("transfers")
        .update({
          date: new Date(date).toISOString(),
          from_warehouse_id: Number.parseInt(fromWarehouseId),
          to_warehouse_id: Number.parseInt(toWarehouseId),
          total_products: transferItems.length, // Update total_products count
          order_tax: Number(orderTax),
          discount: Number(discount),
          shipping: Number(shipping),
          grand_total: calculateGrandTotal(),
          notes: notes || null,
          details: details || null,
          // status: transfer?.status, // Keep existing status or allow editing if needed
        })
        .eq("id", transferId)

      if (transferError) {
        throw transferError
      }

      // Delete existing transfer items
      const { error: deleteError } = await supabase.from("transfer_items").delete().eq("transfer_id", transferId)
      if (deleteError) {
        throw deleteError
      }

      // Insert new/updated transfer items
      const itemsToInsert = transferItems.map((item) => ({
        transfer_id: transferId,
        product_id: item.product_id,
        qty: Number(item.qty),
        net_unit_cost: Number(item.net_unit_cost),
        discount: Number(item.discount),
        tax: Number(item.tax),
        subtotal: Number(item.subtotal),
      }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from("transfer_items").insert(itemsToInsert)
        if (itemsError) {
          throw itemsError
        }
      }

      toast.success("Transfer updated successfully!")
      router.push("/transfer/all-transfers")
    } catch (error: any) {
      console.error("Error updating transfer:", error)
      toast.error("Error updating transfer: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <ToastContainer position="top-center" />
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
            <span className="ml-3 mt-2 text-lg text-gray-700">Loading transfer data...</span>
          </div>
          <Card className="mt-6 p-4 sm:p-6">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
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
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-6" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-24" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="p-3 border-b text-left">
                      <Skeleton className="h-4 w-12" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-4" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-3 border-b">
                        <Skeleton className="h-4 w-12" />
                      </td>
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
    )
  }

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer Not Found</h2>
            <p className="text-gray-600 mb-6">The transfer you're trying to edit doesn't exist or has been deleted.</p>
            <Link href="/transfer/all-transfers">
              <Button>Back to Transfers</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link href="/transfer/all-transfers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Transfers
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Edit Transfer</h1>
            <p className="text-gray-600 text-sm sm:text-base">Ref: {transfer.ref}</p>
          </div>
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
                      {warehouses
                        .filter((w) => w.id.toString() !== fromWarehouseId) // Prevent selecting same warehouse
                        .map((w) => (
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Transfer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
