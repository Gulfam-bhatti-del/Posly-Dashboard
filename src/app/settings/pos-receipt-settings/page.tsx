"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Separator } from "@/components/ui/separator";

interface PosReceiptSettings {
  id?: string;
  note_to_customer: string;
  show_phone: boolean;
  show_address: boolean;
  show_email: boolean;
  show_customer: boolean;
  show_warehouse: boolean;
  show_tax_discount_shipping: boolean;
  note_field: boolean;
  print_invoice_auto: boolean;
}

export default function PosReceiptSettingsPage() {
  const [settings, setSettings] = useState<PosReceiptSettings>({
    note_to_customer: "Thank You For Shopping With Us. Please Come Again",
    show_phone: false,
    show_address: false,
    show_email: false,
    show_customer: false,
    show_warehouse: false,
    show_tax_discount_shipping: false,
    note_field: false,
    print_invoice_auto: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pos_receipt_settings")
        .select("*")
        .single();

      if (data) {
        setSettings(data);
      }
      if (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load settings.");
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    let error = null;
    if (settings.id) {
      const { error: updateError } = await supabase
        .from("pos_receipt_settings")
        .update(settings)
        .eq("id", settings.id);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from("pos_receipt_settings")
        .insert({ ...settings, id: undefined })
        .select()
        .single();
      error = insertError;
      if (data) {
        setSettings(data);
      }
    }

    if (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings.");
    } else {
      toast.success("Settings saved!");
    }
    setLoading(false);
  };

  return (
    <div className="container p-4 max-w-full space-y-6">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold">Pos Receipt Settings</h1>
      <Separator />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Note to customer *</CardTitle>
          <CardDescription>This message appears on the receipt.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={settings.note_to_customer}
            onChange={(e) => setSettings({ ...settings, note_to_customer: e.target.value })}
            className="rounded-md"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Show Phone", key: "show_phone" },
          { label: "Show Address", key: "show_address" },
          { label: "Show Email", key: "show_email" },
          { label: "Show Customer", key: "show_customer" },
          { label: "Show Warehouse", key: "show_warehouse" },
          { label: "Show Tax & Discount & Shipping", key: "show_tax_discount_shipping" },
          { label: "Note to customer", key: "note_field" },
          { label: "Print Invoice automatically", key: "print_invoice_auto" }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between border p-3 rounded-md">
            <Label>{item.label}</Label>
            <Switch
              checked={settings[item.key as keyof PosReceiptSettings] as boolean}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, [item.key]: checked }))
              }
            />
          </div>
        ))}
      </div>

      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Submit"}
        </Button>
      </CardFooter>
    </div>
  );
}
