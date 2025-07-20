"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-toastify"
import Link from "next/link"

type Transfer = {
  id: string
  ref: string
  date: string
  from_warehouse_name: string
  to_warehouse_name: string
  total_products: number
  grand_total: number
  status: string
  created_at: string
}

export default function TransfersList() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchTransfers()
  }, [])

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from("transfers_with_details")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setTransfers(data || [])
    } catch (error) {
      console.error("Error fetching transfers:", error)
      toast.error("Failed to load transfers")
    } finally {
      setLoading(false)
    }
  }

  const deleteTransfer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transfer?")) return

    try {
      const { error } = await supabase.from("transfers").delete().eq("id", id)
      if (error) throw error

      toast.success("Transfer deleted successfully")
      fetchTransfers()
    } catch (error) {
      console.error("Error deleting transfer:", error)
      toast.error("Failed to delete transfer")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      completed: "default",
      cancelled: "destructive",
    } as const

    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_warehouse_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transfers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="text-gray-600">Manage warehouse transfers</p>
        </div>
        <Link href="/transfers/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Transfer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transfers ({filteredTransfers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">No transfers found</div>
              <Link href="/transfers/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Transfer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.ref}</TableCell>
                      <TableCell>{new Date(transfer.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transfer.from_warehouse_name}</TableCell>
                      <TableCell>{transfer.to_warehouse_name}</TableCell>
                      <TableCell>{transfer.total_products}</TableCell>
                      <TableCell>${transfer.grand_total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/transfers/${transfer.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/transfers/${transfer.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTransfer(transfer.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
  )
}
