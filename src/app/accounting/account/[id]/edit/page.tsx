"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useRouter, useParams } from "next/navigation"

export default function UpdateAccountPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id

  const [form, setForm] = useState({
    account_name: "",
    account_num: "",
    detail: "",
  })

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId) return

      setFetchingData(true)
      try {
        const { data, error } = await supabase.from("accounts").select("*").eq("id", accountId).single()

        if (error) {
          toast.error("Failed to fetch account data")
          console.error("Error fetching account:", error)
          router.push("/accounting/account")
          return
        }

        if (data) {
          setForm({
            account_name: data.account_name || "",
            account_num: data.account_num || "",
            detail: data.detail || "",
          })
        }
      } catch (error) {
        toast.error("An unexpected error occurred while fetching data")
        console.error("Error:", error)
      } finally {
        setFetchingData(false)
      }
    }

    fetchAccount()
  }, [accountId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const updateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          account_name: form.account_name,
          account_num: form.account_num,
          detail: form.detail,
        })
        .eq("id", accountId)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Account updated successfully!")
        setMessage("Account updated successfully!")
        // Navigate back to accounts list after a short delay
        setTimeout(() => {
          router.push("/accounting/account")
        }, 1500)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error updating account:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/accounting/account")
  }

  if (fetchingData) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin w-6 h-6" />
            <span>Loading account data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" />

      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Update Account</h1>
      </div>

      <Separator className="my-4" />

      <form onSubmit={updateAccount}>
        <Card className="p-6 space-y-6">
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <Label htmlFor="account_name" className="mb-3 text-gray-400 placeholder:text-gray-200">
                  Account Name *
                </Label>
                <Input
                  id="account_name"
                  name="account_name"
                  type="text"
                  value={form.account_name}
                  onChange={handleChange}
                  placeholder="Enter account name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_num" className="mb-3 text-gray-400">
                  Account Number *
                </Label>
                <Input
                  id="account_num"
                  name="account_num"
                  type="text"
                  value={form.account_num}
                  onChange={handleChange}
                  placeholder="Enter account num"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="detail" className="mb-3 text-gray-400">
                Account Detail *
              </Label>
              <Textarea
                id="detail"
                name="detail"
                value={form.detail}
                onChange={handleChange}
                placeholder="Please provide any details"
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center gap-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {loading ? "Updating Account..." : "Update Account"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            {message && <span className="text-green-600">{message}</span>}
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
