"use client";
import { useState } from "react";
import type React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

export default function AddAccountPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    account_name: "",
    account_num: "",
    balance: "",
    detail: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.from("accounts").insert([
        {
          account_name: form.account_name,
          account_num: form.account_num,
          account_balance: Number.parseFloat(form.balance) || 0,
          detail: form.detail,
        },
      ]);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account added successfully!");
        setMessage("Account added successfully!");
        setForm({
          account_name: "",
          account_num: "",
          balance: "",
          detail: "",
        });
        router.push("/accounting/account");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error adding account:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" />
      <h1 className="text-2xl font-semibold mb-4">Add Account</h1>
      <Separator className="my-4" />

      <form onSubmit={addAccount}>
        <Card className="p-6 space-y-6">
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <Label
                  htmlFor="account_name"
                  className="mb-3 text-gray-400 placeholder:text-gray-200"
                >
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
                  Account Number
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
              <div>
                <Label htmlFor="balance" className="mb-3 text-gray-400">
                  Initial Balance
                </Label>
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  value={form.balance}
                  onChange={handleChange}
                  placeholder="Enter initial balance"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="detail" className="mb-3 text-gray-400">
                Account detail
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
              {loading ? "Adding Account..." : "Add Account"}
            </Button>
            {message && <span className="text-green-600">{message}</span>}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
