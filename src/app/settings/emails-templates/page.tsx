"use client"
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface EmailTemplate {
  subject: string;
  body: string;
}

export default function EmailTemplatesPage() {
  const [clientTemplate, setClientTemplate] = useState<EmailTemplate>({
    subject: "Payment Received - Thank You",
    body: `Dear {{contact_name}},\n\nThank you for making your payment. We have received it and it has been processed successfully.\n\nIf you have any further questions or concerns, please don’t hesitate to reach out to us. We are always here to help.\n\nBest regards,\n{{business_name}}`
  });

  const [supplierTemplate, setSupplierTemplate] = useState<EmailTemplate>({
    subject: "Purchase Acknowledgement",
    body: `Dear {{contact_name}},\n\nI recently made a purchase from your company and I wanted to thank you for your cooperation and service. My invoice number is {{invoice_number}}.\n\nIf you have any questions or concerns regarding my purchase, please don’t hesitate to contact me. I aim to have a positive experience with your company.\n\nBest regards,\n{{business_name}}`
  });

  const handleClientChange = (field: keyof EmailTemplate, value: string) => {
    setClientTemplate({ ...clientTemplate, [field]: value });
  };

  const handleSupplierChange = (field: keyof EmailTemplate, value: string) => {
    setSupplierTemplate({ ...supplierTemplate, [field]: value });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Emails Templates</h1>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Notification Client</h2>
          <Tabs defaultValue="payment_client">
            <TabsList>
              <TabsTrigger value="payment_client">Payment Client</TabsTrigger>
            </TabsList>
            <TabsContent value="payment_client">
              <div className="space-y-4">
                <Label>Subject</Label>
                <Input
                  value={clientTemplate.subject}
                  onChange={(e) => handleClientChange('subject', e.target.value)}
                />

                <Label>Body</Label>
                <Textarea
                  rows={8}
                  value={clientTemplate.body}
                  onChange={(e) => handleClientChange('body', e.target.value)}
                />

                <Button>Submit</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Notification Supplier</h2>
          <Tabs defaultValue="purchase_supplier">
            <TabsList>
              <TabsTrigger value="purchase_supplier">Purchase</TabsTrigger>
            </TabsList>
            <TabsContent value="purchase_supplier">
              <div className="space-y-4">
                <Label>Subject</Label>
                <Input
                  value={supplierTemplate.subject}
                  onChange={(e) => handleSupplierChange('subject', e.target.value)}
                />

                <Label>Body</Label>
                <Textarea
                  rows={8}
                  value={supplierTemplate.body}
                  onChange={(e) => handleSupplierChange('body', e.target.value)}
                />

                <Button>Submit</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
