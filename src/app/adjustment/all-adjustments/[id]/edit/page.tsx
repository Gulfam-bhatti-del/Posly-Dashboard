"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, X } from 'lucide-react'
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { HiAdjustments } from "react-icons/hi"

type Warehouse = {
  id: number
  name: string
}

type Product = {
  id: string
  code: string
  name: string
  current_stock: number
  category: string
  brand: string | null
}

type AdjustmentItem = {
  id?: string
  product_id: string
  code: string
  name: string
  current_stock: number
  qty: number
  type: "increase" | "decrease"
  old_stock?: number
}

type AdjustmentDetail = {
  id: string
  ref: string
  date: string
  warehouse_id: number
  details: string
}

export default function EditAdjustmentPage() {
  const params = useParams()
  const router = useRouter()
  const [adjustment, setAdjustment] = useState<AdjustmentDetail | null>(null)
  const [date, setDate] = useState("")
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseId, setWarehouseId] = useState("")
  const [details, setDetails] = useState("")
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchAdjustmentData(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
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
        .select("id, code, name, current_stock, category, brand")
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

  const fetchWarehouses = async () => {
    const { data, error } = await supabase.from("warehouses").select("*").order("name")
    if (data && !error) {
      setWarehouses(data)
    }
  }

  const fetchAdjustmentData = async (id: string) => {
    setInitialLoading(true)
    try {
      // Fetch adjustment details
      const { data: adjustmentData, error: adjustmentError } = await supabase
        .from("adjustments")
        .select("*")
        .eq("id", id)
        .single()

      if (adjustmentError) {
        console.error("Error fetching adjustment:", adjustmentError)
        alert("Error loading adjustment details")
        router.push("/adjustments")
        return
      }

      // Fetch adjustment items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from("adjustment_items")
        .select(`
          id,
          product_id,
          qty,
          type,
          products (
            code,
            name,
            current_stock
          )
        `)
        .eq("adjustment_id", id)

      if (itemsError) {
        console.error("Error fetching adjustment items:", itemsError)
        alert("Error loading adjustment items")
        return
      }

      setAdjustment(adjustmentData)
      setDate(new Date(adjustmentData.date).toISOString().slice(0, 16))
      setWarehouseId(adjustmentData.warehouse_id?.toString() || "")
      setDetails(adjustmentData.details || "")

      // Transform items data
      const transformedItems =
        itemsData?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          code: item.products.code,
          name: item.products.name,
          current_stock: item.products.current_stock,
          qty: item.qty,
          type: item.type,
        })) || []

      setAdjustmentItems(transformedItems)
    } catch (error) {
      console.error("Error:", error)
      alert("Error loading adjustment data")
      router.push("/adjustments")
    } finally {
      setInitialLoading(false)
    }
  }

  const addProduct = (product: Product) => {
    if (adjustmentItems.some((item) => item.product_id === product.id)) {
      alert("Product already added to adjustment")
      return
    }

    setAdjustmentItems([
      ...adjustmentItems,
      {
        product_id: product.id,
        code: product.code,
        name: product.name,
        current_stock: product.current_stock,
        qty: 1,
        type: "increase",
      },
    ])

    setSearch("")
    setProducts([])
  }

  const updateItem = (idx: number, field: keyof AdjustmentItem, value: any) => {
    setAdjustmentItems((items) => items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const removeItem = (idx: number) => {
    setAdjustmentItems((items) => items.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!warehouseId) {
      alert("Please select a warehouse")
      return
    }

    if (adjustmentItems.length === 0) {
      alert("Please add at least one product to adjust")
      return
    }

    setLoading(true)

    try {
      const { error: adjustmentError } = await supabase
        .from("adjustments")
        .update({
          date: new Date(date).toISOString(),
          warehouse_id: Number.parseInt(warehouseId),
          details,
        })
        .eq("id", params.id as string)

      if (adjustmentError) {
        throw adjustmentError
      }

      const { data: originalItems, error: originalItemsError } = await supabase
        .from("adjustment_items")
        .select(`
          product_id,
          qty,
          type,
          products (current_stock)
        `)
        .eq("adjustment_id", params.id as string)

      if (originalItemsError) {
        throw originalItemsError
      }

      for (const item of originalItems || []) {
        const originalStockChange = item.type === "increase" ? -item.qty : item.qty
        const revertedStock = item.products.current_stock + originalStockChange

        await supabase
          .from("products")
          .update({ current_stock: Math.max(0, revertedStock) })
          .eq("id", item.product_id)
      }

      const { error: deleteError } = await supabase
        .from("adjustment_items")
        .delete()
        .eq("adjustment_id", params.id as string)

      if (deleteError) {
        throw deleteError
      }

      const itemsToInsert = []
      const stockUpdates = []

      for (const item of adjustmentItems) {
        const { data: productData } = await supabase
          .from("products")
          .select("current_stock")
          .eq("id", item.product_id)
          .single()

        const currentStock = productData?.current_stock || 0
        const stockChange = item.type === "increase" ? item.qty : -item.qty
        const newStock = Math.max(0, currentStock + stockChange)

        itemsToInsert.push({
          adjustment_id: params.id as string,
          product_id: item.product_id,
          qty: item.qty,
          type: item.type,
        })

        stockUpdates.push({
          id: item.product_id,
          current_stock: newStock,
        })
      }

      const { error: itemsError } = await supabase.from("adjustment_items").insert(itemsToInsert)

      if (itemsError) {
        throw itemsError
      }

      for (const update of stockUpdates) {
        await supabase.from("products").update({ current_stock: update.current_stock }).eq("id", update.id)
      }

      alert("Adjustment updated successfully!")
      router.push("/adjustment/all-adjustments")
    } catch (error) {
      console.error("Error updating adjustment:", error)
      alert("Error updating adjustment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const calculateNewStock = (item: AdjustmentItem) => {
    const change = item.type === "increase" ? item.qty : -item.qty
    return Math.max(0, item.current_stock + change)
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading adjustment data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!adjustment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Adjustment Not Found</h2>
            <p className="text-gray-600 mb-6">The adjustment you're trying to edit doesn't exist or has been deleted.</p>
            <Link href="/adjustment/all-adjustments">
              <Button>Back to Adjustments</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/adjustment/all-adjustments">
              <ArrowLeft className="w-4 h-4 mr-2" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Stock Adjustment</h1>
            <p className="text-gray-600">{adjustment.ref}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adjustment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Date & Time *</label>
                  <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Warehouse *</label>
                  <Select value={warehouseId} onValueChange={setWarehouseId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
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

              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium">Additional Details</label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Enter any additional details about this adjustment..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder="Search by product name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {searchLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  </div>
                )}
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
                            <div className="text-sm text-gray-500">
                              {p.category} {p.brand && `• ${p.brand}`}
                            </div>
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
              <CardTitle>Adjustment Items ({adjustmentItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {adjustmentItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                    <X className="w-full h-full" />
                  </div>
                  <p>No products in this adjustment</p>
                  <p className="text-sm">Search and add products above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 border-b text-left">#</th>
                        <th className="p-3 border-b text-left">Product Code</th>
                        <th className="p-3 border-b text-left">Product Name</th>
                        <th className="p-3 border-b text-left">Current Stock</th>
                        <th className="p-3 border-b text-left">Quantity</th>
                        <th className="p-3 border-b text-left">Type</th>
                        <th className="p-3 border-b text-left">New Stock</th>
                        <th className="p-3 border-b text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustmentItems.map((item, idx) => (
                        <tr key={item.product_id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{idx + 1}</td>
                          <td className="p-3 border-b font-medium">{item.code}</td>
                          <td className="p-3 border-b">{item.name}</td>
                          <td className="p-3 border-b">{item.current_stock}</td>
                          <td className="p-3 border-b">
                            <Input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", Math.max(1, Number(e.target.value)))}
                              className="w-20"
                            />
                          </td>
                          <td className="p-3 border-b">
                            <Select
                              value={item.type}
                              onValueChange={(val) => updateItem(idx, "type", val as "increase" | "decrease")}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="increase">Increase</SelectItem>
                                <SelectItem value="decrease">Decrease</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 border-b">
                            <span
                              className={`font-medium ${
                                calculateNewStock(item) !== item.current_stock
                                  ? item.type === "increase"
                                    ? "text-green-600"
                                    : "text-red-600"
                                  : ""
                              }`}
                            >
                              {calculateNewStock(item)}
                            </span>
                          </td>
                          <td className="p-3 border-b">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(idx)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href="/adjustment/all-adjustments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Link href={`/adjustments/${adjustment.id}`}>
              <Button type="button" variant="outline">
                View Details
              </Button>
            </Link>
            <Button type="submit" disabled={loading || adjustmentItems.length === 0} className="min-w-32">
              <HiAdjustments className="w-4 h-4 mr-2" />
              {loading ? "Updating..." : "Update Adjustment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
