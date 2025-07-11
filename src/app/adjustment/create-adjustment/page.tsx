"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Warehouse = {
  id: number
  name: string
}

type Product = {
  id: string
  code: string
  name: string
  current_stock: number
}

type AdjustmentItem = {
  product_id: string
  code: string
  name: string
  current_stock: number
  qty: number
  type: "increase" | "decrease"
}

export default function AdjustmentPage() {
  const router = useRouter()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseId, setWarehouseId] = useState("")
  const [details, setDetails] = useState("")
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error } = await supabase.from("warehouses").select("*").order("name")

      if (data && !error) {
        setWarehouses(data)
      }
    }

    fetchWarehouses()
  }, [])

  useEffect(() => {
    if (search.length < 2) {
      setProducts([])
      return
    }

    const searchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, current_stock")
        .or(`name.ilike.%${search}%,code.ilike.%${search}%`)
        .limit(10)

      if (data && !error) {
        setProducts(data)
      }
    }

    const timeoutId = setTimeout(searchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

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
      const { data: adjustment, error: adjustmentError } = await supabase
        .from("adjustments")
        .insert([
          {
            date: new Date(date).toISOString(),
            warehouse_id: Number.parseInt(warehouseId),
            details,
          },
        ])
        .select()
        .single()

      if (adjustmentError) {
        throw adjustmentError
      }

      const items = adjustmentItems.map((item) => ({
        adjustment_id: adjustment.id,
        product_id: item.product_id,
        qty: item.qty,
        type: item.type,
      }))

      const { error: itemsError } = await supabase.from("adjustment_items").insert(items)

      if (itemsError) {
        throw itemsError
      }

      for (const item of adjustmentItems) {
        const stockChange = item.type === "increase" ? item.qty : -item.qty
        const newStock = Math.max(0, item.current_stock + stockChange)

        await supabase.from("products").update({ current_stock: newStock }).eq("id", item.product_id)
      }

      alert("Adjustment created successfully!")

      router.push("/adjustment/all-adjustments")
    } catch (error) {
      console.error("Error creating adjustment:", error)
      alert("Error creating adjustment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = () => {
    setAdjustmentItems([])
    setDetails("")
    setWarehouseId("")
    setDate(new Date().toISOString().slice(0, 16))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/adjustment/all-adjustments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create Stock Adjustment</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
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

          <div className="relative">
            <label className="block mb-2 text-sm font-medium">Search Products</label>
            <Input
              placeholder="Search by product name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {products.length > 0 && (
              <div className="absolute z-10 w-full border rounded-md bg-white mt-1 max-h-48 overflow-auto shadow-lg">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => addProduct(p)}
                  >
                    <div className="font-medium">
                      {p.code} - {p.name}
                    </div>
                    <div className="text-sm text-gray-500">Current Stock: {p.current_stock}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  <th className="p-3 border-b text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      No products added yet. Search and add products above.
                    </td>
                  </tr>
                ) : (
                  adjustmentItems.map((item, idx) => (
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
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(idx)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Additional Details</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter any additional details about this adjustment..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleClearAll}>
              Clear All
            </Button>
            <Link href="/adjustment/all-adjustments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || adjustmentItems.length === 0} className="min-w-32">
              {loading ? "Processing..." : "Submit Adjustment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
