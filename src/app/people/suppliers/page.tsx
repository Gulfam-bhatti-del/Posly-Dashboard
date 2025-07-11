// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
// import { SuppliersDialog } from "@/components/suppliers-dialog"
// import { supabase, type Supplier } from "@/lib/supabase"
// import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
// import { toast } from "sonner"

// export default function SuppliersPage() {
//   const [suppliers, setSuppliers] = useState<Supplier[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [currentPage, setCurrentPage] = useState(1)
//   const [itemsPerPage, setItemsPerPage] = useState(10)
//   const [totalItems, setTotalItems] = useState(0)
//   const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
//   const [editDialogOpen, setEditDialogOpen] = useState(false)
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
//   const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
//   const [deleteLoading, setDeleteLoading] = useState(false)

//   const fetchSuppliers = async () => {
//     try {
//       setLoading(true)

//       let query = supabase.from("suppliers").select("*", { count: "exact" }).order("created_at", { ascending: false })

//       if (searchTerm) {
//         query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
//       }

//       const { data, error, count } = await query.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

//       if (error) throw error

//       setSuppliers(data || [])
//       setTotalItems(count || 0)
//     } catch (error) {
//       toast.error("Failed to fetch suppliers")
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchSuppliers()
//   }, [currentPage, itemsPerPage, searchTerm])

//   const totalPages = Math.ceil(totalItems / itemsPerPage)
//   const startItem = (currentPage - 1) * itemsPerPage + 1
//   const endItem = Math.min(currentPage * itemsPerPage, totalItems)

//   const handleSupplierAdded = () => {
//     fetchSuppliers()
//   }

//   const handleEdit = (supplier: Supplier) => {
//     setEditingSupplier(supplier)
//     setEditDialogOpen(true)
//   }

//   const handleDelete = (supplier: Supplier) => {
//     setSupplierToDelete(supplier)
//     setDeleteDialogOpen(true)
//   }

//   const confirmDelete = async () => {
//     if (!supplierToDelete) return

//     setDeleteLoading(true)
//     try {
//       const { error } = await supabase.from("suppliers").delete().eq("id", supplierToDelete.id)

//       if (error) throw error

//       toast.success("Supplier deleted successfully")

//       setDeleteDialogOpen(false)
//       setSupplierToDelete(null)
//       fetchSuppliers()
//     } catch (error) {
//       toast.error("Failed to delete supplier")
//     } finally {
//       setDeleteLoading(false)
//     }
//   }

//   const formatCurrency = (amount: number) => {
//     return `$ ${amount.toFixed(2)}`
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-semibold">Suppliers</h1>
//       </div>

//       <div className="bg-white rounded-lg border">
//         <div className="p-4 border-b space-y-4">
//           {/* Create button positioned above search */}
//           <div className="flex justify-end">
//             <SuppliersDialog onSupplierAdded={handleSupplierAdded} />
//           </div>

//           <div className="flex items-center justify-between gap-4">
//             <div className="flex items-center gap-4">
//               <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
//                 <SelectTrigger className="w-20">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="10">10</SelectItem>
//                   <SelectItem value="25">25</SelectItem>
//                   <SelectItem value="50">50</SelectItem>
//                   <SelectItem value="100">100</SelectItem>
//                 </SelectContent>
//               </Select>

//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="outline">
//                     EXPORT
//                     <ChevronDown className="w-4 h-4 ml-2" />
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent>
//                   <DropdownMenuItem>Export as CSV</DropdownMenuItem>
//                   <DropdownMenuItem>Export as PDF</DropdownMenuItem>
//                   <DropdownMenuItem>Export as Excel</DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>

//             <Input
//               placeholder="Search..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="max-w-sm"
//             />
//           </div>
//         </div>

//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Action</TableHead>
//               <TableHead>Code</TableHead>
//               <TableHead>Name</TableHead>
//               <TableHead>Phone</TableHead>
//               <TableHead>City</TableHead>
//               <TableHead>Total Purchase Due</TableHead>
//               <TableHead>Total Purchase Return Due</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center py-8">
//                   Loading...
//                 </TableCell>
//               </TableRow>
//             ) : suppliers.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center py-8">
//                   No suppliers found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               suppliers.map((supplier) => (
//                 <TableRow key={supplier.id}>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="outline" size="sm">
//                           Action
//                           <ChevronDown className="w-4 h-4 ml-2" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent>
//                         <DropdownMenuItem onClick={() => handleEdit(supplier)}>Edit</DropdownMenuItem>
//                         <DropdownMenuItem>View</DropdownMenuItem>
//                         <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(supplier)}>
//                           Delete
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                   <TableCell className="font-medium">{supplier.code}</TableCell>
//                   <TableCell className="text-blue-600">{supplier.name}</TableCell>
//                   <TableCell>{supplier.phone || "-"}</TableCell>
//                   <TableCell>{supplier.city || "-"}</TableCell>
//                   <TableCell>{formatCurrency(supplier.total_purchase_due)}</TableCell>
//                   <TableCell>{formatCurrency(supplier.total_purchase_return_due)}</TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>

//         <div className="p-4 border-t">
//           <div className="flex items-center justify-between">
//             <div className="text-sm text-gray-600">
//               Showing {startItem} to {endItem} of {totalItems} entries
//             </div>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={currentPage === 1}
//               >
//                 <ChevronLeft className="w-4 h-4" />
//                 Previous
//               </Button>
//               <Button variant="outline" size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
//                 {currentPage}
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                 disabled={currentPage === totalPages}
//               >
//                 Next
//                 <ChevronRight className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Edit Dialog */}
//       <SuppliersDialog
//         mode="edit"
//         supplier={editingSupplier}
//         open={editDialogOpen}
//         onOpenChange={setEditDialogOpen}
//         onSupplierAdded={handleSupplierAdded}
//       />

//       {/* Delete Confirmation Dialog */}
//       <DeleteConfirmationDialog
//         open={deleteDialogOpen}
//         onOpenChange={setDeleteDialogOpen}
//         onConfirm={confirmDelete}
//         supplierName={supplierToDelete?.name || ""}
//         loading={deleteLoading}
//       />
//     </div>
//   )
// }

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define Supplier type since it's not imported
type Supplier = {
  id: string
  code: string
  name: string
  phone?: string
  city?: string
  total_purchase_due: number
  total_purchase_return_due: number
  created_at: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    city: "",
    total_purchase_due: 0,
    total_purchase_return_due: 0,
  })

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      let query = supabase.from("suppliers").select("*", { count: "exact" }).order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      }

      const { data, error, count } = await query.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error

      setSuppliers(data || [])
      setTotalItems(count || 0)
    } catch (error) {
      toast.error("Failed to fetch suppliers")
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [currentPage, itemsPerPage, searchTerm])

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handleSupplierAdded = () => {
    fetchSuppliers()
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setEditDialogOpen(true)
  }

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!supplierToDelete) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", supplierToDelete.id)

      if (error) throw error

      toast.success("Supplier deleted successfully")
      setDeleteDialogOpen(false)
      setSupplierToDelete(null)
      fetchSuppliers()
    } catch (error) {
      toast.error("Failed to delete supplier")
      console.error("Error deleting supplier:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      phone: "",
      city: "",
      total_purchase_due: 0,
      total_purchase_return_due: 0,
    })
    setEditingSupplier(null)
  }

  const handleCreateClick = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      code: supplier.code,
      name: supplier.name,
      phone: supplier.phone || "",
      city: supplier.city || "",
      total_purchase_due: supplier.total_purchase_due,
      total_purchase_return_due: supplier.total_purchase_return_due,
    })
    setCreateDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingSupplier) {
        setEditLoading(true)
      } else {
        setCreateLoading(true)
      }

      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase.from("suppliers").update(formData).eq("id", editingSupplier.id)

        if (error) throw error
        toast.success("Supplier updated successfully!")
      } else {
        // Create new supplier
        const { error } = await supabase.from("suppliers").insert([formData])

        if (error) throw error
        toast.success("Supplier created successfully!")
      }

      setCreateDialogOpen(false)
      resetForm()
      fetchSuppliers()
    } catch (error) {
      toast.error(editingSupplier ? "Failed to update supplier" : "Failed to create supplier")
      console.error("Error:", error)
    } finally {
      setCreateLoading(false)
      setEditLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `$ ${amount.toFixed(2)}`
  }

  // Mobile Supplier Card Component
  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-blue-600 truncate">{supplier.name}</h3>
              <Badge variant="outline" className="text-xs">
                {supplier.code}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{supplier.phone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>City:</span>
                <span>{supplier.city || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Purchase Due:</span>
                <span className="font-medium">{formatCurrency(supplier.total_purchase_due)}</span>
              </div>
              <div className="flex justify-between">
                <span>Return Due:</span>
                <span className="font-medium">{formatCurrency(supplier.total_purchase_return_due)}</span>
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
              <DropdownMenuItem onClick={() => handleEditClick(supplier)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(supplier)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
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
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
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
        <div className="mb-6 -mt-2">
          <h1 className="mb-4 text-2xl sm:text-3xl">Suppliers</h1>
          <Separator />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div></div>
              <Button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto ml-auto -mb-5">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-16 sm:w-20">
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
                      <Button
                        variant="outline"
                        className="hover:shadow-md hover:shadow-gray-300 transition-shadow duration-200 bg-transparent"
                      >
                        <span className="hidden sm:inline">EXPORT</span>
                        <Download className="w-4 h-4 sm:hidden" />
                        <ChevronDown className="w-4 h-4 ml-2 hidden sm:inline" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                      <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                      <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Total Purchase Due</TableHead>
                      <TableHead className="hidden xl:table-cell">Total Purchase Return Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No suppliers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Action
                                  <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditClick(supplier)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(supplier)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="font-medium">{supplier.code}</TableCell>
                          <TableCell className="text-blue-600 font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.phone || "-"}</TableCell>
                          <TableCell>{supplier.city || "-"}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(supplier.total_purchase_due)}</TableCell>
                          <TableCell className="font-medium hidden xl:table-cell">
                            {formatCurrency(supplier.total_purchase_return_due)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {suppliers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No suppliers found</div>
              ) : (
                suppliers.map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} />)
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {startItem} to {endItem} of {totalItems} entries
              </div>
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
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
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-xs sm:text-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Create Supplier"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] sm:max-h-[70vh] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Supplier code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_purchase_due">Total Purchase Due</Label>
                  <Input
                    id="total_purchase_due"
                    type="number"
                    step="0.01"
                    value={formData.total_purchase_due}
                    onChange={(e) => setFormData({ ...formData, total_purchase_due: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_purchase_return_due">Total Purchase Return Due</Label>
                  <Input
                    id="total_purchase_return_due"
                    type="number"
                    step="0.01"
                    value={formData.total_purchase_return_due}
                    onChange={(e) => setFormData({ ...formData, total_purchase_return_due: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="w-full sm:w-auto bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={createLoading || editLoading}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {createLoading || editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingSupplier ? "Updating..." : "Creating..."}
                </>
              ) : editingSupplier ? (
                "Update Supplier"
              ) : (
                "Create Supplier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
                <p className="text-base sm:text-lg font-medium text-gray-900">Deleting Supplier...</p>
                <p className="text-xs sm:text-sm text-gray-500 px-4">
                  Please wait while we remove {supplierToDelete?.name}
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
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  </div>
                  <span className="text-base sm:text-lg">Delete Supplier</span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm sm:text-base">
                  Are you sure you want to delete <strong className="text-gray-900">"{supplierToDelete?.name}"</strong>?
                  <br />
                  <span className="text-red-600 font-medium">This action cannot be undone.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
                <AlertDialogCancel disabled={deleteLoading} className="w-full sm:w-auto">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500 w-full sm:w-auto"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Supplier
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
