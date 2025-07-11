"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

interface SystemSettings {
  id: string;
  default_email: string;
  company_name: string;
  company_id: string;
  address: string;
  default_language: string;
  currency_format: string;
  timezone: string;
  email_account_host: string;
  email_account_port: number;
  email_account_username: string;
  email_account_password: string;
  email_account_sender_name: string;
  email_account_sender_email: string;
  email_smtp_host: string;
  email_smtp_port: number;
  email_smtp_username: string;
  email_smtp_password: string;
  email_smtp_encryption: string;
  email_smtp_authentication: boolean;
  backup_frequency_days: number;
  project_control_enabled: boolean;
  display_type: string;
  default_dimension: string;
  default_warehouse: string;
  default_cost_center: string;
  auto_reconcile_invoice: boolean;
  auto_reconcile_payment: boolean;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1);

      if (data && data.length > 0) {
        setSettings(data[0]);
        setSettingsId(data[0].id);
      } else {
        setSettings({
          id: "",
          default_email: "",
          company_name: "",
          company_id: "",
          address: "",
          default_language: "English",
          currency_format: "USD",
          timezone: "UTC",
          email_account_host: "",
          email_account_port: 587,
          email_account_username: "",
          email_account_password: "",
          email_account_sender_name: "",
          email_account_sender_email: "",
          email_smtp_host: "",
          email_smtp_port: 587,
          email_smtp_username: "",
          email_smtp_password: "",
          email_smtp_encryption: "TLS",
          email_smtp_authentication: true,
          backup_frequency_days: 7,
          project_control_enabled: false,
          display_type: "Default",
          default_dimension: "Dimension 1",
          default_warehouse: "Warehouse 1",
          default_cost_center: "Cost Center 1",
          auto_reconcile_invoice: false,
          auto_reconcile_payment: false,
        });
      }

      if (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings.");
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            [id]:
              type === "number" ? (value === "" ? "" : Number(value)) : value,
          }
        : prev
    );
  };

  const handleSelectChange = (id: keyof SystemSettings, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [id]: value } : prev));
  };

  const handleSwitchChange = (id: keyof SystemSettings, checked: boolean) => {
    setSettings((prev) => (prev ? { ...prev, [id]: checked } : prev));
  };

  const handleSave = async (section: string) => {
    if (!settings) return;
    setLoading(true);
    let error = null;

    if (settingsId && settingsId !== "") {
      const { error: updateError } = await supabase
        .from("system_settings")
        .update(settings)
        .eq("id", settingsId);
      error = updateError;
    } else {
      const { id, ...insertData } = settings;
      const { data, error: insertError } = await supabase
        .from("system_settings")
        .insert(insertData)
        .select();
      error = insertError;
      if (data && data.length > 0) {
        setSettingsId(data[0].id);
        setSettings(data[0]);
      }
    }

    if (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast.error(`Failed to save ${section} settings.`);
    } else {
      toast.success(`${section} settings saved successfully!`);
    }

    setLoading(false);
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading settings...</p>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-full font-sans">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">System Settings</h1>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Manage your general system configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_email">Default Email</Label>
            <Input
              id="default_email"
              value={settings.default_email}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_type">Display Type</Label>
            <Select
              value={settings.display_type}
              onValueChange={(v) => handleSelectChange("display_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="Option A">Option A</SelectItem>
                <SelectItem value="Option B">Option B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={settings.company_name}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_id">Company ID</Label>
            <Input
              id="company_id"
              value={settings.company_id}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency_format">Currency</Label>
            <Input
              id="currency_format"
              value={settings.currency_format}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(v) => handleSelectChange("timezone", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">
                  America/New_York
                </SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center col-span-1 md:col-span-2">
            <Label>Project Control Enabled</Label>
            <Switch
              checked={settings.project_control_enabled}
              onCheckedChange={(c) =>
                handleSwitchChange("project_control_enabled", c)
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button onClick={() => handleSave("General")} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* EMAIL SETTINGS */}
      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure email settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Email Host</Label>
            <Input
              id="email_account_host"
              value={settings.email_account_host}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>SMTP Host</Label>
            <Input
              id="email_smtp_host"
              value={settings.email_smtp_host}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>Email Port</Label>
            <Input
              type="number"
              id="email_account_port"
              value={settings.email_account_port}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>SMTP Port</Label>
            <Input
              type="number"
              id="email_smtp_port"
              value={settings.email_smtp_port}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>Email User</Label>
            <Input
              id="email_account_username"
              value={settings.email_account_username}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>SMTP User</Label>
            <Input
              id="email_smtp_username"
              value={settings.email_smtp_username}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>Email Password</Label>
            <Input
              type="password"
              id="email_account_password"
              value={settings.email_account_password}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>SMTP Password</Label>
            <Input
              type="password"
              id="email_smtp_password"
              value={settings.email_smtp_password}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>Sender Name</Label>
            <Input
              id="email_account_sender_name"
              value={settings.email_account_sender_name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label>Sender Email</Label>
            <Input
              id="email_account_sender_email"
              value={settings.email_account_sender_email}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-between items-center col-span-2">
            <Label>SMTP Auth</Label>
            <Switch
              checked={settings.email_smtp_authentication}
              onCheckedChange={(c) =>
                handleSwitchChange("email_smtp_authentication", c)
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button onClick={() => handleSave("Email")} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* BACKUP SETTINGS */}
      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>Backup Settings</CardTitle>
          <CardDescription>Set backup frequency.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Backup Frequency (Days)</Label>
            <Input
              type="number"
              id="backup_frequency_days"
              value={settings.backup_frequency_days}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button onClick={() => handleSave("Backup")} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* CLEAR CACHE */}
      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>Clear Cache</CardTitle>
          <CardDescription>Refresh application data.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This will clear cached data.</p>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => toast.success("Cache cleared!")}
          >
            Clear Cache
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
