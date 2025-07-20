"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Download, Filter, Loader2, Pencil, Plus, Search, X } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Quotation {
  id: string // Assuming quotation ID is still UUID/string
  date: string
  ref: string
  customer: string
  warehouse: string
  grand_total: number
}

interface QuotationToDelete {
  id: string
  ref: string
}

function Page() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quotationToDelete, setQuotationToDelete] = useState<QuotationToDelete | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("quotations").select("*")
    setLoading(false)
    if (error) {
      console.error("Error fetching quotations:", error)
    } else {
      setQuotations(data || [])
    }
  }

  const handleDeleteQuotation = async (id: string) => {
    setLoading(true)
    const { error } = await supabase.from("quotations").delete().eq("id", id)
    setLoading(false)
    if (error) {
      console.error("Error deleting quotation:", error)
    } else {
      setQuotations(quotations.filter((q) => q.id !== id))
      setDeleteDialogOpen(false)
      setQuotationToDelete(null)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-4">All Quotations</h1>
        <Separator className="my-4" />
      </div>
      {/* Card Table for show all quotations */}
      <div>
        <Card className="p-4 mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end mb-6 gap-2">
              <Link href="/quotations/add-quotation">
                <Button
                  variant="outline"
                  className="border border-blue-700 hover:bg-blue-700 hover:text-white w-full sm:w-auto bg-transparent"
                >
                  <Plus /> Create
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border border-green-700 hover:bg-green-700 hover:text-white w-full sm:w-auto bg-transparent"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
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
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                    <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search..." className="pl-10" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Warehouse</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                      Loading quotations...
                    </TableCell>
                  </TableRow>
                ) : quotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No quotations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>{new Date(quotation.date).toLocaleDateString()}</TableCell>
                      <TableCell>{quotation.ref}</TableCell>
                      <TableCell>{quotation.customer}</TableCell>
                      <TableCell className="text-right">{quotation.warehouse}</TableCell>
                      <TableCell className="text-right">${Number(quotation.grand_total).toFixed(2)}</TableCell>
                      <TableCell className="text-right flex items-center justify-end space-x-2">
                        <Link href={`/quotations/edit-quotation/${quotation.id}`}>
                          <Pencil className="w-4 h-4 text-blue-600 cursor-pointer mr-2" />
                        </Link>
                        <X
                          className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                          onClick={() => {
                            setQuotationToDelete({
                              id: quotation.id,
                              ref: quotation.ref,
                            })
                            setDeleteDialogOpen(true)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-red-50 to-red-100">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2" />
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Are you sure ?</h2>
              <p className="text-gray-500 mb-6 text-center">You won't be able to revert this!</p>
              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  onClick={() => {
                    if (quotationToDelete) {
                      handleDeleteQuotation(quotationToDelete.id)
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  Yes, delete it
                </Button>
                <Button
                  variant="outline"
                  className="border-red-400 text-red-500 hover:bg-red-50 bg-transparent"
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setQuotationToDelete(null)
                  }}
                  disabled={loading}
                >
                  No, cancel!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default Page
