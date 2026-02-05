"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateMyLocumProfile } from "@/lib/actions/locums";

interface LocumProfileFormProps {
  initialEmail: string;
  initialPhone: string;
}

export function LocumProfileForm({ initialEmail, initialPhone }: LocumProfileFormProps) {
  const { refresh } = useRefresh();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);

  const hasChanges = email !== initialEmail || phone !== initialPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateMyLocumProfile({ email, phone });
      if (result.success) {
        toast.success("Profile updated successfully");
        refresh();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+27 12 345 6789"
        />
      </div>

      <Button type="submit" disabled={loading || !hasChanges} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </form>
  );
}
