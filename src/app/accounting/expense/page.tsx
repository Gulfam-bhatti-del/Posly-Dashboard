"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Search, ChevronDown, FileText, Filter } from 'lucide-react'
import { supabase, type Expense } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [pageSize, setPageSize] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }
      setExpenses(data || [])
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    setDeleteLoading(true)
    try {
      if (expense.attachment_url) {
        const fileName = expense.attachment_url.split("/").pop()
        if (fileName) {
          await supabase.storage.from("expense-attachments").remove([fileName])
        }
      }

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id)

      if (error) {
        throw error
      }

      setExpenses(expenses.filter((e) => e.id !== expense.id))
    } catch (error) {
      console.error("Error deleting expense:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const totalEntries = filteredExpenses.length
  const startIndex = (currentPage - 1) * Number.parseInt(pageSize)
  const endIndex = Math.min(startIndex + Number.parseInt(pageSize), totalEntries)
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)
  const totalPages = Math.ceil(totalEntries / Number.parseInt(pageSize))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "Advertising and marketing": "bg-blue-100 text-blue-800 border-blue-200",
      "Office supplies": "bg-green-100 text-green-800 border-green-200",
      "Travel": "bg-purple-100 text-purple-800 border-purple-200",
      "Meals": "bg-orange-100 text-orange-800 border-orange-200",
      "Utilities": "bg-red-100 text-red-800 border-red-200",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading expenses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Expense List</h1>
        <Separator className="my-6" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-end gap-2 -mb-4">
              <Link href="/accounting/expense/create">
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
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue />
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
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                    EXPORT
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Account Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Expense Ref</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Payment Method</TableHead>
                  <TableHead className="font-semibold text-gray-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense, index) => (
                  <TableRow 
                    key={expense.id} 
                    className={`hover:bg-blue-50 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {expense.account_name}
                    </TableCell>
                    <TableCell className="text-blue-600 font-mono">
                      {expense.expense_ref}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatDate(expense.date)}</div>
                        <div className="text-sm text-gray-500">
                          {formatTime(expense.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {Number(expense.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${getCategoryColor(expense.category)} border font-medium`}
                      >
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-sm font-medium">
                        {expense.payment_method}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/expenses/${expense.id}/edit`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-green-50 hover:text-green-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={() => {
                            setExpenseToDelete(expense)
                            setDeleteDialogOpen(true)
                          }}
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

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-gray-300"
              >
                Previous
              </Button>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(1)}
                className={currentPage === 1 ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
              >
                1
              </Button>
             
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                >
                  Next
                </Button>
            </div>
          </div>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-red-50 to-red-100">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2" />
              </DialogHeader>
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  Are you sure?
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                  This expense will be permanently deleted. You won't be able to revert this action!
                </p>

                <div className="flex gap-4">
                  <Button
                    variant="destructive"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 shadow-lg"
                    onClick={async () => {
                      if (expenseToDelete) {
                        await handleDeleteExpense(expenseToDelete)
                        setDeleteDialogOpen(false)
                        setExpenseToDelete(null)
                      }
                    }}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    ) : null}
                    Yes, delete it
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-6"
                    onClick={() => {
                      setDeleteDialogOpen(false)
                      setExpenseToDelete(null)
                    }}
                    disabled={deleteLoading}
                  >
                    No, cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
