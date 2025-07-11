"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft, Save, Loader2, CheckCheck, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function CreateExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    account: "",
    category: "",
    expenseRef: "",
    date: "",
    amount: "",
    paymentMethod: "",
    details: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `attachments/${fileName}`

      const { error: uploadError } = await supabase.storage.from("expense-attachments").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("expense-attachments").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Error uploading file:", error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let attachmentUrl = null

      if (selectedFile) {
        attachmentUrl = await uploadFile(selectedFile)
      }

      const { error } = await supabase.from("expenses").insert([
        {
          account_name: formData.account,
          expense_ref: formData.expenseRef,
          date: formData.date,
          amount: Number.parseFloat(formData.amount),
          category: formData.category,
          payment_method: formData.paymentMethod,
          attachment_url: attachmentUrl,
          details: formData.details,
        },
      ])

      if (error) throw error

      router.push("/accounting/expense")
    } catch (error) {
      console.error("Error creating expense:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Expense</h1>
        <Separator className="my-6" />
      </div>

      <div>
        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-sm font-semibold text-gray-700">
                    Account *
                  </Label>
                  <Select value={formData.account} onValueChange={(value) => handleInputChange("account", value)}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Choose Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advertising and marketing">Advertising and marketing</SelectItem>
                      <SelectItem value="Office supplies">Office supplies</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Meals">Meals</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseRef" className="text-sm font-semibold text-gray-700">
                    Expense Ref *
                  </Label>
                  <Input
                    id="expenseRef"
                    placeholder="Enter expense reference"
                    value={formData.expenseRef}
                    onChange={(e) => handleInputChange("expenseRef", e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                    Amount *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm font-semibold text-gray-700">
                    Payment Method *
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange("paymentMethod", value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Choose payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachment" className="text-sm font-semibold text-gray-700">
                  Attachment
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                  <input
                    id="attachment"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label htmlFor="attachment" className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-600 font-medium">
                      {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">PNG, JPG, PDF up to 5MB</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details" className="text-sm font-semibold text-gray-700">
                  Additional Details
                </Label>
                <Textarea
                  id="details"
                  placeholder="Please provide any additional details about this expense..."
                  value={formData.details}
                  onChange={(e) => handleInputChange("details", e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check />
                      Submit
                    </>
                  )}
                </Button>
                <Link href="/accounting/expense">
                  <Button variant="outline" className="border-gray-300 px-8 bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
