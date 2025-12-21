"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePracticeSettings } from "@/lib/actions/practice";

type PracticeSettingsFormProps = {
  practice: {
    id: string;
    name: string;
    practiceNumber: string | null;
    address: string | null;
    phone: string | null;
    email: string;
  } | null;
};

export function PracticeSettingsForm({ practice }: PracticeSettingsFormProps) {
  const { refresh } = useRefresh();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: practice?.name || "",
    practiceNumber: practice?.practiceNumber || "",
    address: practice?.address || "",
    phone: practice?.phone || "",
    email: practice?.email || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePracticeSettings(formData);
      refresh();
      toast.success("Practice settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Information</CardTitle>
        <CardDescription>
          Update your practice details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="practice-name">Practice Name</Label>
              <Input
                id="practice-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Smith's Family Practice"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-number">Practice Number</Label>
              <Input
                id="practice-number"
                value={formData.practiceNumber}
                onChange={(e) => setFormData({ ...formData, practiceNumber: e.target.value })}
                placeholder="PR12345"
              />
              <p className="text-xs text-slate-500">Your practice registration/license number</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Practice Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street, Cape Town, 8001"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+27 21 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@drsmith.co.za"
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
