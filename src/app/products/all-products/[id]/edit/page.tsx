"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-toastify"
import Link from "next/link"

interface Product {
  id: string
  name: string
  code: string
  category: string
  brand: string
  order_tax: number
  tax_method: string
  details: string | null
  type: string
  cost: number
  price: number
  unit_product: string
  unit_sale: string
  unit_purchase: string
  minimum_quantity: number
  stock_alert: number
  has_imei: boolean
  current_stock: number
  image_url: string | null
}

export default function EditProduct() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetchingProduct, setFetchingProduct] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    brand: "",
    order_tax: "",
    tax_method: "exclusive",
    details: "",
    type: "standard",
    cost: "",
    price: "",
    unit_product: "",
    unit_sale: "",
    unit_purchase: "",
    minimum_quantity: "",
    stock_alert: "",
    has_imei: false,
    current_stock: "",
    image_url: "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("")

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name,
          code: data.code,
          category: data.category,
          brand: data.brand || "",
          order_tax: data.order_tax.toString(),
          tax_method: data.tax_method,
          details: data.details || "",
          type: data.type,
          cost: data.cost.toString(),
          price: data.price.toString(),
          unit_product: data.unit_product,
          unit_sale: data.unit_sale,
          unit_purchase: data.unit_purchase,
          minimum_quantity: data.minimum_quantity.toString(),
          stock_alert: data.stock_alert.toString(),
          has_imei: data.has_imei,
          current_stock: data.current_stock.toString(),
          image_url: data.image_url || "",
        })
        setCurrentImageUrl(data.image_url || "")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      toast.error("Failed to fetch product details")
      router.push("/products/all-products")
    } finally {
      setFetchingProduct(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
      return null
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setSelectedFile(null)
    setImagePreview("")
    setCurrentImageUrl("")
    setFormData((prev) => ({ ...prev, image_url: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = currentImageUrl

      // Upload new image if selected
      if (selectedFile) {
        const newImageUrl = await uploadImage(selectedFile)
        if (newImageUrl) {
          imageUrl = newImageUrl
          // Delete old image if exists
          if (currentImageUrl) {
            const oldImagePath = currentImageUrl.split("/").pop()
            if (oldImagePath) {
              await supabase.storage.from("product-images").remove([`products/${oldImagePath}`])
            }
          }
        }
      }

      const { data, error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          code: formData.code,
          category: formData.category,
          brand: formData.brand,
          order_tax: Number.parseFloat(formData.order_tax) || 0,
          tax_method: formData.tax_method,
          details: formData.details,
          type: formData.type,
          cost: Number.parseFloat(formData.cost) || 0,
          price: Number.parseFloat(formData.price) || 0,
          unit_product: formData.unit_product,
          unit_sale: formData.unit_sale,
          unit_purchase: formData.unit_purchase,
          minimum_quantity: Number.parseInt(formData.minimum_quantity) || 0,
          stock_alert: Number.parseInt(formData.stock_alert) || 0,
          has_imei: formData.has_imei,
          current_stock: Number.parseInt(formData.current_stock) || 0,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .select()

      if (error) throw error

      toast.success("Product updated successfully!")
      router.push("/products/all-products")
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingProduct) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading product...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter Name Product"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Product Code *</Label>
                <Input
                  id="code"
                  placeholder="Product code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                    <SelectItem value="computers">Computers</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {imagePreview || currentImageUrl ? (
                  <div className="relative">
                    <img
                      src={imagePreview || currentImageUrl || "/placeholder.svg"}
                      alt="Product preview"
                      width={200}
                      height={200}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Click to upload product image
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
              {uploading && <div className="text-sm text-blue-600">Uploading image...</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Product Cost *</Label>
                <Input
                  id="cost"
                  placeholder="Enter Product Cost"
                  value={formData.cost}
                  onChange={(e) => handleInputChange("cost", e.target.value)}
                  type="number"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Product Price *</Label>
                <Input
                  id="price"
                  placeholder="Enter Product Price"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  type="number"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock</Label>
                <Input
                  id="current_stock"
                  placeholder="Current Stock"
                  value={formData.current_stock}
                  onChange={(e) => handleInputChange("current_stock", e.target.value)}
                  type="number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Product Details</Label>
              <Textarea
                id="details"
                placeholder="Please provide any details"
                value={formData.details}
                onChange={(e) => handleInputChange("details", e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_imei"
                checked={formData.has_imei}
                onCheckedChange={(checked) => handleInputChange("has_imei", checked as boolean)}
              />
              <Label htmlFor="has_imei">Product Has Imei/Serial number</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Product"}
              </Button>
              <Link href="/products">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
