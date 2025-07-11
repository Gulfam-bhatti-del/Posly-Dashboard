"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  PlusIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  Search,
  Download,
  Loader2,
  MoreVertical,
  Building2,
} from "lucide-react"

type Warehouse = {
  id: number
  name: string
  phone: string
  country: string
  city: string
  email: string
  zip_code: string
  created_at: string
  updated_at: string
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [form, setForm] = useState<Omit<Warehouse, "id" | "created_at" | "updated_at">>({
    name: "",
    phone: "",
    country: "",
    city: "",
    email: "",
    zip_code: "",
  })

  useEffect(() => {
    fetchWarehouses()
  }, [])

  async function fetchWarehouses() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("warehouses").select("*").order("created_at", { ascending: false })

      if (!error && data) {
        setWarehouses(data)
      } else if (error) {
        toast.error("Failed to fetch warehouses")
        console.error("Error fetching warehouses:", error)
      }
    } catch (error) {
      toast.error("Failed to fetch warehouses")
      console.error("Error fetching warehouses:", error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({
      name: "",
      phone: "",
      country: "",
      city: "",
      email: "",
      zip_code: "",
    })
    setEditingWarehouse(null)
  }

  function handleCreateClick() {
    resetForm()
    setOpen(true)
  }

  function handleEditClick(warehouse: Warehouse) {
    setEditingWarehouse(warehouse)
    setForm({
      name: warehouse.name,
      phone: warehouse.phone,
      country: warehouse.country,
      city: warehouse.city,
      email: warehouse.email,
      zip_code: warehouse.zip_code,
    })
    setOpen(true)
  }

  function handleDeleteClick(warehouse: Warehouse) {
    setWarehouseToDelete(warehouse)
    setDeleteDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingWarehouse) {
        setEditLoading(true)
      } else {
        setCreateLoading(true)
      }

      if (editingWarehouse) {
        const { error } = await supabase.from("warehouses").update(form).eq("id", editingWarehouse.id)

        if (!error) {
          toast.success("Warehouse updated successfully!")
          setOpen(false)
          resetForm()
          fetchWarehouses()
        } else {
          toast.error("Failed to update warehouse")
          console.error("Error updating warehouse:", error)
        }
      } else {
        const { error } = await supabase.from("warehouses").insert([form])

        if (!error) {
          toast.success("Warehouse created successfully!")
          setOpen(false)
          resetForm()
          fetchWarehouses()
        } else {
          toast.error("Failed to create warehouse")
          console.error("Error creating warehouse:", error)
        }
      }
    } catch (error) {
      toast.error(editingWarehouse ? "Failed to update warehouse" : "Failed to create warehouse")
      console.error("Error:", error)
    } finally {
      setCreateLoading(false)
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!warehouseToDelete) return

    try {
      setDeleteLoading(true)

      const { error } = await supabase.from("warehouses").delete().eq("id", warehouseToDelete.id)

      if (!error) {
        toast.success("Warehouse deleted successfully!")
        setDeleteDialogOpen(false)
        setWarehouseToDelete(null)
        fetchWarehouses()
      } else {
        toast.error("Failed to delete warehouse")
        console.error("Error deleting warehouse:", error)
      }
    } catch (error) {
      toast.error("Failed to delete warehouse")
      console.error("Error deleting warehouse:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.zip_code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const paginatedWarehouses = filteredWarehouses.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredWarehouses.length / pageSize)

  const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{warehouse.name}</h3>
              <p className="text-sm text-gray-600 truncate">{warehouse.phone}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {warehouse.country}
                </Badge>
                <span className="text-xs text-gray-500">{warehouse.city}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <div className="truncate">{warehouse.email}</div>
                <div>Zip: {warehouse.zip_code}</div>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditClick(warehouse)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteClick(warehouse)} className="text-red-600">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <Skeleton className="h-6 w-24 sm:h-8 sm:w-32" />
                <Skeleton className="h-8 w-20 sm:h-10 sm:w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <Skeleton className="h-8 w-12 sm:h-10 sm:w-16" />
                    <Skeleton className="h-8 w-20 sm:h-10 sm:w-24" />
                  </div>
                  <Skeleton className="h-8 w-full sm:h-10 sm:w-64" />
                </div>
                <Separator />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
                        <Skeleton className="h-3 w-32 sm:h-4 sm:w-48" />
                      </div>
                      <div className="hidden sm:flex space-x-2">
                        <Skeleton className="h-6 w-12 sm:h-6 sm:w-16" />
                        <Skeleton className="h-4 w-16 sm:h-4 sm:w-24" />
                      </div>
                      <div className="flex space-x-1 sm:space-x-2">
                        <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 -mt-3">
          <h1 className="text-2xl sm:text-3xl text-gray-900 mb-3">Warehouse</h1>
          <Separator />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div></div>
              <Button
                onClick={handleCreateClick}
                variant="outline"
                className="bg-blue-500 hover:text-white text-white hover:bg-blue-600 cursor-pointer -mb-5 w-full sm:w-auto ml-auto"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-16 sm:w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-20 sm:w-24 hover:shadow-md hover:shadow-gray-300 transition-shadow duration-200">
                      <span className="hidden sm:inline">EXPORT</span>
                      <Download className="w-4 h-4 sm:hidden" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="print">Print</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="hidden lg:block">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Zip Code</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWarehouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No warehouses found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedWarehouses.map((warehouse) => (
                        <TableRow key={warehouse.id}>
                          <TableCell className="font-medium">{warehouse.name}</TableCell>
                          <TableCell>{warehouse.phone}</TableCell>
                          <TableCell>{warehouse.country}</TableCell>
                          <TableCell>{warehouse.city}</TableCell>
                          <TableCell>{warehouse.email}</TableCell>
                          <TableCell>{warehouse.zip_code}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontalIcon className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditClick(warehouse)}>
                                  <EditIcon className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(warehouse)} className="text-red-600">
                                  <TrashIcon className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="lg:hidden">
              {paginatedWarehouses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No warehouses found.</div>
              ) : (
                paginatedWarehouses.map((warehouse) => <WarehouseCard key={warehouse.id} warehouse={warehouse} />)
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-3 sm:space-y-0">
              <p className="text-sm text-gray-600 text-center sm:text-left">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredWarehouses.length)} of {filteredWarehouses.length} entries
              </p>
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  Previous
                </Button>
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page = i + 1
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        page = currentPage - 2 + i
                      }
                      if (currentPage > totalPages - 2) {
                        page = totalPages - 4 + i
                      }
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 p-0 text-xs sm:text-sm ${
                          currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Create"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] sm:max-h-[70vh] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600">Name *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter Warehouse Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Enter Warehouse Phone"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600">Country</Label>
                  <Input
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="Enter Warehouse Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Enter Warehouse City"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Enter Warehouse Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Zip Code</Label>
                  <Input
                    value={form.zip_code}
                    onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
                    placeholder="Enter Warehouse Zip Code"
                  />
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto bg-transparent">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={createLoading || editLoading}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {createLoading || editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingWarehouse ? "Updating..." : "Creating..."}
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          {deleteLoading ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-600"></div>
                <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-transparent rounded-full animate-ping border-t-red-400"></div>
              </div>
              <div className="mt-4 sm:mt-6 space-y-2 text-center">
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <p className="text-base sm:text-lg font-medium text-gray-900">Deleting Warehouse...</p>
                <p className="text-xs sm:text-sm text-gray-500 px-4">
                  Please wait while we remove {warehouseToDelete?.name}
                </p>
              </div>
              <div className="mt-4 sm:mt-6 w-48 sm:w-64">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  </div>
                  <span className="text-base sm:text-lg">Are you sure?</span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm sm:text-base">
                  This action cannot be undone. This will permanently delete the warehouse{" "}
                  <strong className="text-gray-900">"{warehouseToDelete?.name}"</strong> and remove its data from the
                  server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
                <AlertDialogCancel
                  onClick={() => setWarehouseToDelete(null)}
                  disabled={deleteLoading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="mt-16 sm:mt-0"
      />
    </div>
  )
}
