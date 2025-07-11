"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Plus, Edit, Trash2, Search, Upload, CameraOffIcon, Download, Camera } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

interface Brand {
  id: string
  name: string
  description: string
  image_url?: string
  created_at: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
  })
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deletingBrand, setDeleteingBrand] = useState<Brand | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch brands from Supabase
  const fetchBrands = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("brands").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error("Error fetching brands:", error)
      toast.error("Failed to fetch brands")
    } finally {
      setLoading(false)
    }
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `brands/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("images").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
      return null
    }
  }

  // Create brand
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Brand name is required")
      return
    }

    try {
      setSubmitting(true)
      let imageUrl = null

      if (formData.image) {
        imageUrl = await uploadImage(formData.image)
      }

      const { error } = await supabase.from("brands").insert([
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          image_url: imageUrl,
        },
      ])

      if (error) throw error

      toast.success("Brand created successfully!")
      setCreateDialogOpen(false)
      setFormData({ name: "", description: "", image: null })
      fetchBrands()
    } catch (error) {
      console.error("Error creating brand:", error)
      toast.error("Failed to create brand")
    } finally {
      setSubmitting(false)
    }
  }

  // Update brand
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBrand || !formData.name.trim()) return

    try {
      setSubmitting(true)
      let imageUrl: any = editingBrand.image_url

      if (formData.image) {
        imageUrl = await uploadImage(formData.image)
      }

      const { error } = await supabase
        .from("brands")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          image_url: imageUrl,
        })
        .eq("id", editingBrand.id)

      if (error) throw error

      toast.success("Brand updated successfully!")
      setEditDialogOpen(false)
      setEditingBrand(null)
      setFormData({ name: "", description: "", image: null })
      fetchBrands()
    } catch (error) {
      console.error("Error updating brand:", error)
      toast.error("Failed to update brand")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingBrand) return

    try {
      const { error } = await supabase.from("brands").delete().eq("id", deletingBrand.id)

      if (error) throw error

      toast.success("Brand deleted successfully!")
      setDeleteDialogOpen(false)
      setDeleteingBrand(null)
      fetchBrands()
    } catch (error) {
      console.error("Error deleting brand:", error)
      toast.error("Failed to delete brand")
    }
  }

  // Open edit dialog
  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      description: brand.description,
      image: null,
    })
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (brand: Brand) => {
    setDeleteingBrand(brand)
    setDeleteDialogOpen(true)
  }

  // Filter brands based on search term
  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination
  const totalPages = Math.ceil(filteredBrands.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedBrands = filteredBrands.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  return (
    <div className="container mx-auto p-3">
      <ToastContainer position="top-center" />
      <div className="mb-6">

      <h1 className="text-2xl text-gray-900 mb-3">All Brands</h1>
      <Separator />
      </div>
      <Card className="w-full">
        <div className="p-6">
          <div className="flex justify-end items-center mb-5 -mt-4">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name of Brand *</Label>
                    <Input
                      id="name"
                      placeholder="Enter Name Brand"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Please provide any details</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
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
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-gray-600 font-medium">Image</TableHead>
                  <TableHead className="text-gray-600 font-medium">Name</TableHead>
                  <TableHead className="text-gray-600 font-medium">Description</TableHead>
                  <TableHead className="text-gray-600 font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedBrands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No brands found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBrands.map((brand) => (
                    <TableRow key={brand.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                          {brand.image_url ? (
                            <img
                              src={brand.image_url || "/placeholder.svg"}
                              alt={brand.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-red-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{brand.name}</TableCell>
                      <TableCell className="text-gray-600">{brand.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(brand)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(brand)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredBrands.length)} of{" "}
              {filteredBrands.length} entries
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-gray-600"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2)
                if (page > totalPages) return null
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600 text-white" : "text-gray-600"}
                  >
                    {page}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-gray-600"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name of Brand *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter Name Brand"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Please provide any details</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-image">Image</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
                {submitting ? "Updating..." : "Update"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the brand "{deletingBrand?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  )
}
