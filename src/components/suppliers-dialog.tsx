"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { supabase, type Supplier } from "@/lib/supabase"
import { toast } from "sonner"

interface SuppliersDialogProps {
  onSupplierAdded: () => void
  supplier?: Supplier | null
  mode?: "create" | "edit"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SuppliersDialog({
  onSupplierAdded,
  supplier = null,
  mode = "create",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SuppliersDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    city: "",
    phone: "",
    address: "",
  })

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  useEffect(() => {
    if (supplier && mode === "edit") {
      setFormData({
        name: supplier.name || "",
        email: supplier.email || "",
        country: supplier.country || "",
        city: supplier.city || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
      })
    } else {
      setFormData({
        name: "",
        email: "",
        country: "",
        city: "",
        phone: "",
        address: "",
      })
    }
  }, [supplier, mode])

  const generateCode = () => {
    return Math.floor(100 + Math.random() * 900).toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "edit" && supplier) {
        const { error } = await supabase
          .from("suppliers")
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            country: formData.country || null,
            city: formData.city || null,
            address: formData.address || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", supplier.id)

        if (error) throw error

        toast.success("Supplier updated successfully")
      } else {
        const { error } = await supabase.from("suppliers").insert([
          {
            code: generateCode(),
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            country: formData.country || null,
            city: formData.city || null,
            address: formData.address || null,
          },
        ])

        if (error) throw error

        toast.success("Supplier created successfully")
      }

      if (mode === "create") {
        setFormData({
          name: "",
          email: "",
          country: "",
          city: "",
          phone: "",
          address: "",
        })
      }
      setOpen(false)
      onSupplierAdded()
    } catch (error) {
      toast.error(`Failed to ${mode} supplier`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600">
              {loading ? "Updating..." : "Update"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600">
            {loading ? "Creating..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}