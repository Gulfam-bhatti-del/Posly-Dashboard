"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-toastify"
import Image from "next/image"

export default function CreateProduct() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    image_url: "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  const generateProductCode = () => {
    const newCode = "GED" + Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData((prev) => ({
      ...prev,
      code: newCode,
    }))
    toast.success("Product code generated!")
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
    setFormData((prev) => ({ ...prev, image_url: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = ""
      if (selectedFile) {
        imageUrl = (await uploadImage(selectedFile)) || ""
      }

      const { data, error } = await supabase
        .from("products")
        .insert([
          {
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
            current_stock: 0,
            image_url: imageUrl,
          },
        ])
        .select()

      if (error) throw error

      toast.success("Product created successfully!")
      router.push("/products/all-products")
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error("Failed to create product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
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
                <div className="flex">
                  <Input
                    id="code"
                    placeholder="generate the barcode"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-2 bg-transparent flex items-center"
                    onClick={generateProductCode}
                    aria-label="Auto generate product code"
                  >
                    <Sparkles className="w-4 h-4 mr-1" /> Auto
                  </Button>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="samsung">Samsung</SelectItem>
                    <SelectItem value="nike">Nike</SelectItem>
                    <SelectItem value="adidas">Adidas</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_tax">Order Tax</Label>
                <div className="flex">
                  <Input
                    id="order_tax"
                    placeholder="0"
                    value={formData.order_tax}
                    onChange={(e) => handleInputChange("order_tax", e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <span className="ml-2 flex items-center">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_method">Tax Method *</Label>
                <Select value={formData.tax_method} onValueChange={(value) => handleInputChange("tax_method", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                    <SelectItem value="inclusive">Inclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
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

            <div className="space-y-2">
              <Label htmlFor="details">Please provide any details</Label>
              <Textarea
                id="details"
                placeholder="Please provide any details"
                value={formData.details}
                onChange={(e) => handleInputChange("details", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Product Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Product</SelectItem>
                    <SelectItem value="digital">Digital Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_product">Unit Product *</Label>
                <Select
                  value={formData.unit_product}
                  onValueChange={(value) => handleInputChange("unit_product", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Product Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pc">Piece</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_sale">Unit Sale *</Label>
                <Select value={formData.unit_sale} onValueChange={(value) => handleInputChange("unit_sale", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Sale Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pc">Piece</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_purchase">Unit Purchase *</Label>
                <Select
                  value={formData.unit_purchase}
                  onValueChange={(value) => handleInputChange("unit_purchase", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Purchase Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pc">Piece</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_quantity">Minimum sale quantity</Label>
                <Input
                  id="minimum_quantity"
                  placeholder="0"
                  value={formData.minimum_quantity}
                  onChange={(e) => handleInputChange("minimum_quantity", e.target.value)}
                  type="number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_alert">Stock Alert</Label>
                <Input
                  id="stock_alert"
                  placeholder="0"
                  value={formData.stock_alert}
                  onChange={(e) => handleInputChange("stock_alert", e.target.value)}
                  type="number"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_imei"
                checked={formData.has_imei}
                onCheckedChange={(checked) => handleInputChange("has_imei", checked as boolean)}
              />
              <Label htmlFor="has_imei">Product Has Imei/Serial number</Label>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Creating..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}