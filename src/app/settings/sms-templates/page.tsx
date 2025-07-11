"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";
import { Loader } from "lucide-react";

interface SMSTemplates {
  id?: string;
  type: string;
  category: string;
  body: string;
}

export default function SmsTemplatesSettings() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Record<string, string>>({});

  const categories = {
    client: ["sales", "quotations", "payment_sale"],
    supplier: ["purchase", "payment_purchase"],
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sms_templates")
        .select("type, category, body");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row) => {
          map[`${row.type}_${row.category}`] = row.body;
        });
        setTemplates(map);
      }
      if (error) {
        toast.error("Failed to load templates");
      }
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  const handleSubmit = async (type: string, category: string) => {
    setLoading(true);
    const body = templates[`${type}_${category}`] || "";
    const { error } = await supabase
      .from("sms_templates")
      .upsert({ type, category, body });
    if (error) {
      toast.error("Save failed");
    } else {
      toast.success("Saved");
    }
    setLoading(false);
  };

  return (
    <div className="container p-6 space-y-8">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold">SMS Templates</h1>

      {Object.entries(categories).map(([type, cats]) => (
        <Card key={type} className="space-y-4">
          <CardHeader>
            <CardTitle>
              Notification {type.charAt(0).toUpperCase() + type.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={cats[0]} className="w-full">
              <TabsList>
                {cats.map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat.replace("_", " ").toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {cats.map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <div className="mb-2 text-sm text-muted-foreground">
                    Available Tags:{" "}
                    {
                      "{contact_name}, {business_name}, {invoice_number}, {invoice_url}, {total_amount}, {paid_amount}, {due_amount}"
                    }
                  </div>
                  <Textarea
                    rows={6}
                    value={templates[`${type}_${cat}`] || ""}
                    onChange={(e) =>
                      setTemplates((prev) => ({
                        ...prev,
                        [`${type}_${cat}`]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    onClick={() => handleSubmit(type, cat)}
                    className="mt-4"
                    disabled={loading}
                  >
                    {loading ? <Loader className="animate-spin" /> : "Submit"}
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
