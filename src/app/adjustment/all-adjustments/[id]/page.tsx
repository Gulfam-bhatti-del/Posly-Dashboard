"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Package, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

type AdjustmentDetail = {
  id: string
  ref: string
  date: string
  warehouse_name: string
  details: string
  total_products: number
  created_at: string
}

type AdjustmentItem = {
  id: string
  product_id: string
  qty: number
  type: "increase" | "decrease"
  products: {
    code: string
    name: string
    current_stock: number
    category: string
    brand: string
  }
}

export default function AdjustmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [adjustment, setAdjustment] = useState<AdjustmentDetail | null>(null)
  const [items, setItems] = useState<AdjustmentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchAdjustmentDetail(params.id as string)
    }
  }, [params.id])

  const fetchAdjustmentDetail = async (id: string) => {
    setLoading(true)
    try {
      const { data: adjustmentData, error: adjustmentError } = await supabase
        .from("adjustments_with_details")
        .select("*")
        .eq("id", id)
        .single()

      if (adjustmentError) {
        console.error("Error fetching adjustment:", adjustmentError)
        alert("Error loading adjustment details")
        return
      }

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
            current_stock,
            category,
            brand
          )
        `)
        .eq("adjustment_id", id)

      if (itemsError) {
        console.error("Error fetching adjustment items:", itemsError)
        alert("Error loading adjustment items")
        return
      }

      setAdjustment(adjustmentData)
      setItems(itemsData || [])
    } catch (error) {
      console.error("Error:", error)
      alert("Error loading adjustment details")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!adjustment) return

    if (confirm(`Are you sure you want to delete adjustment ${adjustment.ref}?`)) {
      try {
        const { error } = await supabase.from("adjustments").delete().eq("id", adjustment.id)

        if (error) {
          alert("Error deleting adjustment")
          return
        }

        alert("Adjustment deleted successfully")
        router.push("/adjustments")
      } catch (error) {
        console.error("Error deleting adjustment:", error)
        alert("Error deleting adjustment")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading adjustment details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!adjustment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Adjustment Not Found</h2>
            <p className="text-gray-600 mb-6">The adjustment you're looking for doesn't exist or has been deleted.</p>
            <Link href="/adjustments">
              <Button>Back to Adjustments</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/adjustment/all-adjustments">
                <ArrowLeft className="w-4 h-4 mr-2" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Adjustment Details</h1>
              <p className="text-gray-600">{adjustment.ref}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/adjustment/all-adjustments/${adjustment.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 bg-transparent"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Date & Time</p>
                  <p className="text-lg font-semibold">{new Date(adjustment.date).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Warehouse</p>
                  <p className="text-lg font-semibold">{adjustment.warehouse_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-lg font-semibold">{adjustment.total_products} items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {adjustment.details && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{adjustment.details}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Adjustment Items</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No items found for this adjustment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{item.products.code}</span>
                        </TableCell>
                        <TableCell className="font-medium">{item.products.name}</TableCell>
                        <TableCell>{item.products.category}</TableCell>
                        <TableCell>{item.products.brand || "N/A"}</TableCell>
                        <TableCell>{item.products.current_stock}</TableCell>
                        <TableCell className="font-semibold">{item.qty}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.type === "increase" ? "default" : "destructive"}
                            className={
                              item.type === "increase"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {item.type === "increase" ? "Increase" : "Decrease"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
