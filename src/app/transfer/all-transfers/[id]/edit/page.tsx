// 'use client'

// import React, { useEffect, useState } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { Card } from '@/components/ui/card'
// import { Separator } from '@/components/ui/separator'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea'
// import { supabase } from '@/lib/supabase'

// export default function EditTransferPage() {
//     const router = useRouter()
//     const searchParams = useSearchParams()
//     const id = searchParams.get('id')

//     const [transfer, setTransfer] = useState({
//         ref: '',
//         date: '',
//         from_warehouse: '',
//         to_warehouse: '',
//         order_tax: 0,
//         total_products: 0,
//         discount: 0,
//         shipping: 0,
//         details: '',
//         grand_total: 0,
//     })
//     const [loading, setLoading] = useState(true)

//     useEffect(() => {
//         const fetchTransfer = async () => {
//             if (!id) return
//             const { data, error } = await supabase
//                 .from('transfer')
//                 .select('*')
//                 .eq('id', id)
//                 .single()
//             if (data) {
//                 setTransfer({
//                     ref: data.ref || '',
//                     date: data.date ? data.date.slice(0, 16) : '',
//                     from_warehouse: data.from_warehouse || '',
//                     to_warehouse: data.to_warehouse || '',
//                     order_tax: data.order_tax || 0,
//                     total_products: data.total_products || 0,
//                     discount: data.discount || 0,
//                     shipping: data.shipping || 0,
//                     details: data.details || '',
//                     grand_total: data.grand_total || 0,
//                 })
//             }
//             setLoading(false)
//         }
//         fetchTransfer()
//     }, [id])

//     const handleUpdateTransfer = async (e: React.FormEvent) => {
//         e.preventDefault()
//         if (!id) return
//         const { error } = await supabase
//             .from('transfer')
//             .update({
//                 ref: transfer.ref,
//                 date: transfer.date,
//                 from_warehouse: transfer.from_warehouse,
//                 to_warehouse: transfer.to_warehouse,
//                 order_tax: transfer.order_tax,
//                 total_products: transfer.total_products,
//                 discount: transfer.discount,
//                 shipping: transfer.shipping,
//                 details: transfer.details,
//                 grand_total: transfer.grand_total,
//             })
//             .eq('id', id)
//         if (error) {
//             console.error('Error updating transfer:', error)
//         } else {
//             router.push('/all-transfers')
//         }
//     }

//     if (loading) {
//         return <div className="p-6">Loading...</div>
//     }

//     return (
//         <div className="min-h-screen bg-gray-50 p-6">
//             <div className="max-w-7xl mx-auto">
//                 <h1 className="text-3xl">Edit Transfer</h1>
//                 <Separator className="my-5" />
//                 <Card className="p-5 mb-6">
//                     <form onSubmit={handleUpdateTransfer}>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="ref">Reference *</label>
//                                 <Input
//                                     type="text"
//                                     id="ref"
//                                     value={transfer.ref}
//                                     onChange={(e) => setTransfer({ ...transfer, ref: e.target.value })}
//                                     name="ref"
//                                     required
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="date">Date *</label>
//                                 <Input
//                                     type="datetime-local"
//                                     id="date"
//                                     value={transfer.date}
//                                     onChange={(e) => setTransfer({ ...transfer, date: e.target.value })}
//                                     name="date"
//                                     required
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="from_warehouse">From Warehouse *</label>
//                                 <Select
//                                     value={transfer.from_warehouse}
//                                     onValueChange={(value) => setTransfer({ ...transfer, from_warehouse: value })}
//                                 >
//                                     <SelectTrigger id="from_warehouse" className="w-full">
//                                         <SelectValue placeholder="Select warehouse" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="1">Warehouse 1</SelectItem>
//                                         <SelectItem value="2">Warehouse 2</SelectItem>
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="to_warehouse">To Warehouse *</label>
//                                 <Select
//                                     value={transfer.to_warehouse}
//                                     onValueChange={(value) => setTransfer({ ...transfer, to_warehouse: value })}
//                                 >
//                                     <SelectTrigger id="to_warehouse" className="w-full">
//                                         <SelectValue placeholder="Select warehouse" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="1">Warehouse 1</SelectItem>
//                                         <SelectItem value="2">Warehouse 2</SelectItem>
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//                         </div>

//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="order_tax">Order Tax</label>
//                                 <div className="flex">
//                                     <Input
//                                         type="number"
//                                         id="order_tax"
//                                         name="order_tax"
//                                         className="rounded-l"
//                                         value={transfer.order_tax}
//                                         onChange={(e) => setTransfer({ ...transfer, order_tax: Number(e.target.value) })}
//                                     />
//                                     <span className="inline-flex items-center px-2 border border-l-0 rounded-r bg-gray-100 text-gray-600">%</span>
//                                 </div>
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="discount">Discount</label>
//                                 <div className="flex">
//                                     <Input
//                                         type="number"
//                                         id="discount"
//                                         name="discount"
//                                         className="rounded-l"
//                                         value={transfer.discount}
//                                         onChange={(e) => setTransfer({ ...transfer, discount: Number(e.target.value) })}
//                                     />
//                                     <Select>
//                                         <SelectTrigger className="border border-l-0 rounded-r bg-gray-100 text-gray-600 w-24">
//                                             <SelectValue placeholder="Select" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="Fixed">Fixed</SelectItem>
//                                             <SelectItem value="Percent">Percent</SelectItem>
//                                         </SelectContent>
//                                     </Select>
//                                 </div>
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="shipping">Shipping</label>
//                                 <div className="flex">
//                                     <Input
//                                         type="number"
//                                         id="shipping"
//                                         name="shipping"
//                                         className="rounded-l"
//                                         value={transfer.shipping}
//                                         onChange={(e) => setTransfer({ ...transfer, shipping: Number(e.target.value) })}
//                                     />
//                                     <span className="inline-flex items-center px-2 border border-l-0 rounded-r bg-gray-100 text-gray-600">$</span>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="grand_total">Grand Total</label>
//                                 <Input
//                                     type="number"
//                                     id="grand_total"
//                                     name="grand_total"
//                                     value={transfer.grand_total}
//                                     onChange={(e) => setTransfer({ ...transfer, grand_total: Number(e.target.value) })}
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium mb-1" htmlFor="total_products">Total Products</label>
//                                 <Input
//                                     type="number"
//                                     id="total_products"
//                                     name="total_products"
//                                     value={transfer.total_products}
//                                     onChange={(e) => setTransfer({ ...transfer, total_products: Number(e.target.value) })}
//                                 />
//                             </div>
//                         </div>
//                         <div className="mb-4">
//                             <label className="block text-sm font-medium mb-1" htmlFor="details">Please provide any details</label>
//                             <Textarea
//                                 id="details"
//                                 name="details"
//                                 rows={2}
//                                 placeholder="Please provide any details"
//                                 value={transfer.details}
//                                 onChange={(e) => setTransfer({ ...transfer, details: e.target.value })}
//                             />
//                         </div>
//                         <Button type="submit" className="mt-2">
//                             Update Transfer
//                         </Button>
//                     </form>
//                 </Card>
//             </div>
//         </div>
//     )
// }




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
import { ArrowLeft, Save, Trash2, Search } from "lucide-react"
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
  id?: string
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
  notes: string
  details: string
}

export default function EditTransferPage() {
  const params = useParams()
  const router = useRouter()
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
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTransferData(params.id as string)
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

  const fetchWarehouses = async () => {
    const { data, error } = await supabase.from("warehouses").select("*").order("name")
    if (data && !error) {
      setWarehouses(data)
    }
  }

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
        showError("Error loading transfer details")
        console.error("Error fetching transfer:", transferError)
        router.push("/transfers")
        return
      }

      // Fetch transfer items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from("transfer_items")
        .select(`
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
            current_stock
          )
        `)
        .eq("transfer_id", id)

      if (itemsError) {
        showError("Error loading transfer items")
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
      showError("Error loading transfer data")
      console.error("Error:", error)
      router.push("/transfers")
    } finally {
      setInitialLoading(false)
    }
  }

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
      // Update the transfer record
      const { error: transferError } = await supabase
        .from("transfers")
        .update({
          date: new Date(date).toISOString(),
          from_warehouse_id: Number.parseInt(fromWarehouseId),
          to_warehouse_id: Number.parseInt(toWarehouseId),
          order_tax: orderTax,
          discount: discount,
          shipping: shipping,
          grand_total: calculateGrandTotal(),
          notes,
          details,
        })
        .eq("id", params.id as string)

      if (transferError) {
        throw transferError
      }

      // Delete existing transfer items
      const { error: deleteError } = await supabase
        .from("transfer_items")
        .delete()
        .eq("transfer_id", params.id as string)

      if (deleteError) {
        throw deleteError
      }

      // Create new transfer items
      const itemsToInsert = transferItems.map((item) => ({
        transfer_id: params.id as string,
        product_id: item.product_id,
        qty: item.qty,
        net_unit_cost: item.net_unit_cost,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal,
      }))

      const { error: itemsError } = await supabase.from("transfer_items").insert(itemsToInsert)

      if (itemsError) {
        throw itemsError
      }

      showSuccess("Transfer updated successfully!")
      router.push("/transfers")
    } catch (error) {
      console.error("Error updating transfer:", error)
      showError("Error updating transfer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading transfer data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer Not Found</h2>
            <p className="text-gray-600 mb-6">The transfer you're trying to edit doesn't exist or has been deleted.</p>
            <Link href="/transfers">
              <Button>Back to Transfers</Button>
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
          <Link href="/transfers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Transfers
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Transfer</h1>
            <p className="text-gray-600">{transfer.ref}</p>
          </div>
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
              <CardTitle>Transfer Items ({transferItems.length})</CardTitle>
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
                        <span>
                          {calculateGrandTotal() > 0 ? ((orderTax / calculateGrandTotal()) * 100).toFixed(2) : 0}%
                        </span>
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
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Updating..." : "Update Transfer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
