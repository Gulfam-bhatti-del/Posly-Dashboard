"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";
import { Loader2 } from "lucide-react";

interface SmsSettings {
  id?: string;
  default_sms: string;
  twilio_sid: string;
  twilio_token: string;
  twilio_from: string;
  nexmo_key: string;
  nexmo_secret: string;
  nexmo_from: string;
  infobip_base_url: string;
  infobip_api_key: string;
  infobip_sender_from: string;
}

export default function SmsSettingsPage() {
  const [settings, setSettings] = useState<SmsSettings>({
    default_sms: "Twilio",
    twilio_sid: "",
    twilio_token: "",
    twilio_from: "",
    nexmo_key: "",
    nexmo_secret: "",
    nexmo_from: "",
    infobip_base_url: "",
    infobip_api_key: "",
    infobip_sender_from: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("sms_settings").select("*").single();
      if (data) setSettings(data);
      if (error) toast.error("Failed to load settings");
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (type: string) => {
    setSaving(type);
    let error = null;
    if (settings.id) {
      ({ error } = await supabase.from("sms_settings").update(settings).eq("id", settings.id));
    } else {
      const res = await supabase.from("sms_settings").insert(settings).select().single();
      error = res.error;
      if (res.data) setSettings(res.data);
    }
    if (error) {
      console.error(error);
      toast.error(`Failed to save ${type} settings`);
    } else {
      toast.success(`${type} settings saved`);
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold">SMS Settings</h1>
      <Separator />

      <form onSubmit={(e) => { e.preventDefault(); handleSave("Default SMS"); }}>
        <Card>
          <CardHeader>
            <CardTitle>Default SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={settings.default_sms} onValueChange={(v) => setSettings({ ...settings, default_sms: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Twilio">Twilio</SelectItem>
                <SelectItem value="Nexmo">Nexmo</SelectItem>
                <SelectItem value="Infobip">Infobip</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={saving==="Default SMS"}>{saving==="Default SMS" ? <Loader2 className="animate-spin" /> : "Submit"}</Button>
          </CardFooter>
        </Card>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); handleSave("Twilio API"); }}>
        <Card>
          <CardHeader><CardTitle>Twilio API</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Twilio SID" value={settings.twilio_sid} onChange={(e) => setSettings({ ...settings, twilio_sid: e.target.value })} />
            <Input placeholder="Twilio TOKEN" value={settings.twilio_token} onChange={(e) => setSettings({ ...settings, twilio_token: e.target.value })} />
            <Input placeholder="Twilio FROM" value={settings.twilio_from} onChange={(e) => setSettings({ ...settings, twilio_from: e.target.value })} />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={saving==="Twilio API"}>{saving==="Twilio API" ? <Loader2 className="animate-spin" /> : "Submit"}</Button>
          </CardFooter>
        </Card>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); handleSave("Nexmo"); }}>
        <Card>
          <CardHeader><CardTitle>Nexmo (now Vonage)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="NEXMO KEY" value={settings.nexmo_key} onChange={(e) => setSettings({ ...settings, nexmo_key: e.target.value })} />
            <Input placeholder="NEXMO SECRET" value={settings.nexmo_secret} onChange={(e) => setSettings({ ...settings, nexmo_secret: e.target.value })} />
            <Input placeholder="NEXMO FROM" value={settings.nexmo_from} onChange={(e) => setSettings({ ...settings, nexmo_from: e.target.value })} />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={saving==="Nexmo"}>{saving==="Nexmo" ? <Loader2 className="animate-spin" /> : "Submit"}</Button>
          </CardFooter>
        </Card>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); handleSave("Infobip"); }}>
        <Card>
          <CardHeader><CardTitle>Infobip API</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="BASE URL" value={settings.infobip_base_url} onChange={(e) => setSettings({ ...settings, infobip_base_url: e.target.value })} />
            <Input placeholder="API KEY" value={settings.infobip_api_key} onChange={(e) => setSettings({ ...settings, infobip_api_key: e.target.value })} />
            <Input placeholder="SMS sender number Or Name" value={settings.infobip_sender_from} onChange={(e) => setSettings({ ...settings, infobip_sender_from: e.target.value })} />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={saving==="Infobip"}>{saving==="Infobip" ? <Loader2 className="animate-spin" /> : "Submit"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
