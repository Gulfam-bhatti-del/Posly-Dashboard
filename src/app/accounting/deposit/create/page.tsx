"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast, ToastContainer } from "react-toastify"

export default function CreateDeposit() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
      let attachmentUrl = null
      let attachmentName = null

      // Upload file if attachment exists
      if (attachment) {
        const uploadResult = await uploadFile(attachment, formData.deposit_ref)
        attachmentUrl = uploadResult.url
        attachmentName = uploadResult.name
      }

      // Insert deposit record
      const { error } = await supabase.from("deposits").insert({
        account_name: formData.account_name,
        category: formData.category,
        deposit_ref: formData.deposit_ref,
        date: formData.date,
        amount: Number.parseFloat(formData.amount),
        payment_method: formData.payment_method,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        details: formData.details,
      })

      if (error) {
        throw error
      }

      toast.success("Deposit created successfully!")

      router.push("/accounting/deposit")
    } catch (error) {
      console.error("Error creating deposit:", error)
      toast.error("Failed to create deposit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
        <ToastContainer />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create deposit</CardTitle>
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
              <Input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
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

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
