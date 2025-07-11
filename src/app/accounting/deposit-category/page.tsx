"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, X, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { supabase, type Expense_Deposit_Category } from "@/lib/supabase"

export default function depositCategoriesComponent() {
  const [isdepositDialogOpen, setIsdepositDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingdeposit, setEditingdeposit] = useState<Expense_Deposit_Category | null>(null)
  const [notification, setNotification] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const [depositForm, setdepositForm] = useState<Omit<Expense_Deposit_Category, "id" | "created_at">>({
    title: "",
  })

  const [deposits, setdeposits] = useState<Expense_Deposit_Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState("10")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [depositToDelete, setdepositToDelete] = useState<Expense_Deposit_Category | null>(null)

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification({ type: null, message: "" })
    }, 5000)
  }

  const fetchdeposits = async () => {
    try {
      const { data, error } = await supabase
        .from("deposit_categories")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Fetch error:", error)
        showNotification("error", `Failed to fetch categories: ${error.message}`)
      } else {
        setdeposits(data || [])
      }
    } catch (err) {
      console.error("Unexpected fetch error:", err)
      showNotification("error", "Failed to load deposit categories")
    }
  }

  useEffect(() => {
    fetchdeposits()
  }, [])

  const handledepositInputChange = (
    field: keyof Omit<Expense_Deposit_Category, "id" | "created_at">,
    value: string,
  ) => {
    setdepositForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAdddeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("deposit_categories").insert([depositForm])

      if (error) {
        console.error("Insert error:", error)
        showNotification("error", `Failed to add category: ${error.message}`)
      } else {
        showNotification("success", "deposit category added successfully")
        setIsdepositDialogOpen(false)
        setdepositForm({ title: "" })
        await fetchdeposits()
      }
    } catch (err) {
      console.error("Unexpected insert error:", err)
      showNotification("error", "An unexpected error occurred while adding the category")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditdeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingdeposit) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("deposit_categories")
        .update({ title: depositForm.title })
        .eq("id", editingdeposit.id)

      if (error) {
        console.error("Update error:", error)
        showNotification("error", `Failed to update category: ${error.message}`)
      } else {
        showNotification("success", "deposit category updated successfully")
        setIsEditDialogOpen(false)
        setEditingdeposit(null)
        setdepositForm({ title: "" })
        await fetchdeposits()
      }
    } catch (err) {
      console.error("Unexpected update error:", err)
      showNotification("error", "An unexpected error occurred while updating the category")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletedeposit = async () => {
    if (!depositToDelete) {
      showNotification("error", "No category selected for deletion")
      return
    }

    setDeleteLoading(true)

    try {
      console.log("Deleting deposit with ID:", depositToDelete.id)
      
      const { error } = await supabase
        .from("deposit_categories")
        .delete()
        .eq("id", depositToDelete.id)

      if (error) {
        console.error("Delete error:", error)
        showNotification("error", `Failed to delete category: ${error.message}`)
      } else {
        showNotification("success", "deposit category deleted successfully")
        // Close dialog and reset state
        setDeleteDialogOpen(false)
        setdepositToDelete(null)
        // Refresh the list
        await fetchdeposits()
      }
    } catch (err) {
      console.error("Unexpected delete error:", err)
      showNotification("error", "An unexpected error occurred while deleting the category")
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEditDialog = (deposit: Expense_Deposit_Category) => {
    setEditingdeposit(deposit)
    setdepositForm({ title: deposit.title })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (deposit: Expense_Deposit_Category) => {
    setdepositToDelete(deposit)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setdepositToDelete(null)
  }

  const filtereddeposits = deposits.filter((deposit) => 
    deposit.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displayeddeposits =
    entriesPerPage === "All" ? filtereddeposits : filtereddeposits.slice(0, Number.parseInt(entriesPerPage))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">deposit Categories</h1>
          {notification.type && (
            <div
              className={`mb-4 p-4 rounded-md ${
                notification.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{notification.message}</span>
                <button
                  onClick={() => setNotification({ type: null, message: "" })}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <div className="w-full h-px bg-gray-200 mt-2"></div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-24 hover:shadow-md hover:shadow-gray-300 transition-shadow duration-200">
                    <span>EXPORT</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="print">Print</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search..."
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                  onClick={() => setIsdepositDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex">
              <table className="w-full">
                <thead className="bg-gray-50 border-y">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Title</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayeddeposits.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 px-6 text-center text-gray-400">
                        No deposit categories found.
                      </td>
                    </tr>
                  ) : (
                    displayeddeposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b">
                        <td className="py-4 px-6">{deposit.title}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(deposit)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(deposit)}
                              className="text-red-600 hover:text-red-800"
                              disabled={deleteLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
              <div className="text-sm text-gray-600">
                Showing {displayeddeposits.length > 0 ? 1 : 0} to {displayeddeposits.length} of{" "}
                {filtereddeposits.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled className="text-gray-400 bg-transparent">
                  Previous
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled className="text-gray-400 bg-transparent">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add deposit Dialog */}
        <Dialog open={isdepositDialogOpen} onOpenChange={setIsdepositDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdddeposit} className="space-y-4">
              <div className="space-y-4">
                <Label className="text-gray-700">Title *</Label>
                <Input
                  value={depositForm.title}
                  onChange={(e) => handledepositInputChange("title", e.target.value)}
                  required
                  placeholder="Enter category name"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  "Add Category"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit deposit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit deposit Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditdeposit} className="space-y-4">
              <div className="space-y-4">
                <Label className="text-gray-700">Title *</Label>
                <Input
                  value={depositForm.title}
                  onChange={(e) => handledepositInputChange("title", e.target.value)}
                  required
                  placeholder="Enter category name"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating
                  </>
                ) : (
                  "Update Category"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-red-50 to-red-100">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2" />
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Are you sure?</h2>
              <p className="text-gray-600 mb-2 text-center">
                You are about to delete the category:
              </p>
              <p className="text-gray-800 font-semibold mb-4 text-center">
                "{depositToDelete?.title}"
              </p>
              <p className="text-gray-600 mb-6 text-center">
                This action cannot be undone!
              </p>
              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 shadow-lg"
                  onClick={handleDeletedeposit}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  Yes, delete it
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white px-6"
                  onClick={closeDeleteDialog}
                  disabled={deleteLoading}
                >
                  No, cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
