"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  Filter,
  Plus,
  Search,
  ChevronDown,
  Check,
  View,
  Edit,
  Delete,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Sales, supabase } from "@/lib/supabase"
import { toast, ToastContainer } from "react-toastify"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function PaymentStatusBadge({ status }: { status: string }) {
  let color = ""
  if (status === "Paid") color = "bg-green-100 text-green-700 border-green-300"
  else if (status === "Partial") color = "bg-blue-100 text-blue-700 border-blue-300"
  else color = "bg-yellow-100 text-yellow-700 border-yellow-300"
  return <span className={`px-2 py-1 rounded text-xs border ${color}`}>{status}</span>
}

export default function Sale() {
  useEffect(() => {
    fetchSales()
  }, [])

  const [sales, setSales] = useState<Sales[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)

  const fetchSales = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("sales").select("*")

    if (!error && data) {
      setSales(data)
      setLoading(false)
      toast(
        <div>
          <span className="flex items-center gap-2">
            <Check className="text-green-600" /> Sales successfully fetched
          </span>
        </div>,
      )
    } else {
      setLoading(false)
      toast.error(error?.message || "Error fetching sales")
    }
  }

  // Delete Function from supabase
  const handleDeleteSales = async (id: number) => {
    if (!id) {
      toast.error("No sale selected for deletion")
      return
    }
    setDeleting(true)
    const { error } = await supabase.from("sales").delete().eq("id", id)

    if (!error) {
      toast.success("Sale deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedSaleId(null)
      fetchSales()
    } else {
      toast.error(error.message)
    }
    setDeleting(false)
  }

  return (
    <div>
      <ToastContainer />
      <div>
        <h1 className="text-2xl font-semibold mb-4">All Sales</h1>
        <Separator className="my-4" />
      </div>
      <div>
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-end mb-6 gap-2">
              <Link href="/sales/create-sale">
                <Button variant="outline" className="border border-blue-700 hover:bg-blue-700 hover:text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </Link>
              <Button variant="outline" className="border border-green-700 hover:bg-green-700 hover:text-white">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Select>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      EXPORT
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                    <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      No Sales found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-blue-400 text-blue-700">
                              Action <ChevronDown className="w-4 h-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <View /> View
                            </DropdownMenuItem>
                            <Link href={`/sales/all-sales/${s.id}/edit`}>
                              <DropdownMenuItem>
                                <Edit /> Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              onSelect={e => {
                                e.preventDefault()
                                setSelectedSaleId(Number(s.id))
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Delete className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        {new Date(s.date).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{s.ref}</TableCell>
                      <TableCell>{s.created_by}</TableCell>
                      <TableCell>{s.customer}</TableCell>
                      <TableCell>{s.warehouse}</TableCell>
                      <TableCell>
                        ${" "}
                        {Number(s.grand_total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        ${" "}
                        {Number(s.paid).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        ${" "}
                        {Number(s.due).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={s.payment_status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                Showing 1 to {sales.length} of {sales.length} entries
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled>
                  Previous
                </Button>
                <span className="border px-2 py-1 rounded bg-blue-100 text-blue-700">1</span>
                <Button variant="ghost" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-red-50 to-red-100">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              Are you sure you want to delete this sale?
            </h2>
            <p className="text-gray-500 mb-6 text-center">
              This action cannot be undone. The sale will be permanently removed.
            </p>
            <div className="flex gap-4">
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white px-6"
                onClick={() => selectedSaleId && handleDeleteSales(selectedSaleId)}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Yes, delete it
              </Button>
              <Button
                variant="outline"
                className="border-gray-400 text-gray-500 hover:bg-gray-50"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setSelectedSaleId(null)
                }}
                disabled={deleting}
              >
                No, cancel!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}