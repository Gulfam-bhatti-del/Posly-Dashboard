"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase, type Deposit } from "@/lib/supabase"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { toast, ToastContainer } from "react-toastify"

export default function EditDeposit() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [formData, setFormData] = useState({
    account_name: "",
    category: "",
    deposit_ref: "",
    date: "",
    amount: "",
    payment_method: "",
    details: "",
  })
  const [attachment, setAttachment] = useState<File | null>(null)
  const [currentAttachment, setCurrentAttachment] = useState<{
    url: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchDeposit(params.id as string)
    }
  }, [params.id])

  const fetchDeposit = async (id: string) => {
    try {
      const { data, error } = await supabase.from("deposits").select("*").eq("id", id).single()

      if (error) {
        throw error
      }

      if (data) {
        setDeposit(data)
        setFormData({
          account_name: data.account_name,
          category: data.category,
          deposit_ref: data.deposit_ref,
          date: data.date,
          amount: data.amount.toString(),
          payment_method: data.payment_method,
          details: data.details || "",
        })

        if (data.attachment_url && data.attachment_name) {
          setCurrentAttachment({
            url: data.attachment_url,
            name: data.attachment_name,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching deposit:", error)
      toast.error("Failed to fetch deposit details")
      router.push("/deposits")
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setAttachment(file || null)
  }

  const uploadFile = async (file: File, depositRef: string) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${depositRef}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage.from("deposit-attachments").upload(filePath, file)

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from("deposit-attachments").getPublicUrl(filePath)

    return { url: data.publicUrl, name: file.name }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let attachmentUrl = currentAttachment?.url || null
      let attachmentName = currentAttachment?.name || null

      // Upload new file if attachment exists
      if (attachment) {
        // Delete old attachment if exists
        if (currentAttachment?.url) {
          const oldFileName = currentAttachment.url.split("/").pop()
          if (oldFileName) {
            await supabase.storage.from("deposit-attachments").remove([oldFileName])
          }
        }

        const uploadResult = await uploadFile(attachment, formData.deposit_ref)
        attachmentUrl = uploadResult.url
        attachmentName = uploadResult.name
      }

      // Update deposit record
      const { error } = await supabase
        .from("deposits")
        .update({
          account_name: formData.account_name,
          category: formData.category,
          deposit_ref: formData.deposit_ref,
          date: formData.date,
          amount: Number.parseFloat(formData.amount),
          payment_method: formData.payment_method,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          details: formData.details,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) {
        throw error
      }

      toast.success("Deposit updated successfully!")

      router.push("/accounting/deposit")
    } catch (error) {
      console.error("Error updating deposit:", error)
      toast.error("Failed to update deposit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const removeCurrentAttachment = async () => {
    if (currentAttachment?.url) {
      try {
        const fileName = currentAttachment.url.split("/").pop()
        if (fileName) {
          await supabase.storage.from("deposit-attachments").remove([fileName])
        }

        // Update database to remove attachment
        await supabase
          .from("deposits")
          .update({
            attachment_url: null,
            attachment_name: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.id)

        setCurrentAttachment(null)
        toast.success("Attachment removed successfully")
      } catch (error) {
        console.error("Error removing attachment:", error)
        toast.error("Failed to remove attachment")
      }
    }
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading deposit details...</div>
      </div>
    )
  }

  if (!deposit) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Deposit not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
        <ToastContainer />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Link href="/deposits">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Deposits
              </Button>
            </Link>
            <CardTitle className="text-2xl">Edit Deposit</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account">Account *</Label>
                <Select
                  value={formData.account_name}
                  onValueChange={(value) => handleInputChange("account_name", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Account Global">Account Global</SelectItem>
                    <SelectItem value="Account Local">Account Local</SelectItem>
                    <SelectItem value="Account Regional">Account Regional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Advertising and marketing">Advertising and marketing</SelectItem>
                    <SelectItem value="Office supplies">Office supplies</SelectItem>
                    <SelectItem value="Travel expenses">Travel expenses</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_ref">Deposit ref *</Label>
                <Input
                  id="deposit_ref"
                  placeholder="Enter deposit ref"
                  value={formData.deposit_ref}
                  onChange={(e) => handleInputChange("deposit_ref", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleInputChange("payment_method", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Other Payment Method">Other Payment Method</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment</Label>
              {currentAttachment && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-2">
                  <span className="text-sm text-gray-600">Current file: {currentAttachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(currentAttachment.url, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={removeCurrentAttachment}>
                    Remove
                  </Button>
                </div>
              )}
              <Input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
              {attachment && <p className="text-sm text-gray-600">New file selected: {attachment.name}</p>}
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

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Deposit"}
              </Button>
              <Link href="/deposits">
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
