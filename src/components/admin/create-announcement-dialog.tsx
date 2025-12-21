"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createAnnouncement } from "@/lib/actions/admin/system";
import { useRouter } from "next/navigation";
import { AnnouncementType, SubscriptionTier } from "@prisma/client";

export function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "INFO" as AnnouncementType,
    showFrom: new Date().toISOString().split("T")[0],
    showUntil: "",
    targetTiers: [] as SubscriptionTier[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createAnnouncement({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        showFrom: new Date(formData.showFrom),
        showUntil: formData.showUntil ? new Date(formData.showUntil) : undefined,
        targetTiers: formData.targetTiers.length > 0 ? formData.targetTiers : undefined,
      });
      setOpen(false);
      setFormData({
        title: "",
        message: "",
        type: "INFO",
        showFrom: new Date().toISOString().split("T")[0],
        showUntil: "",
        targetTiers: [],
      });
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Create a new platform-wide announcement for users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Announcement message..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementType })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="SUCCESS">Success</option>
                <option value="ERROR">Error</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showFrom">Show From</Label>
                <Input
                  id="showFrom"
                  type="date"
                  value={formData.showFrom}
                  onChange={(e) => setFormData({ ...formData, showFrom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showUntil">Show Until (optional)</Label>
                <Input
                  id="showUntil"
                  type="date"
                  value={formData.showUntil}
                  onChange={(e) => setFormData({ ...formData, showUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Subscription Tiers (leave empty for all)</Label>
              <div className="flex flex-wrap gap-2">
                {(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as SubscriptionTier[]).map((tier) => (
                  <label key={tier} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.targetTiers.includes(tier)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetTiers: [...formData.targetTiers, tier] });
                        } else {
                          setFormData({
                            ...formData,
                            targetTiers: formData.targetTiers.filter((t) => t !== tier),
                          });
                        }
                      }}
                    />
                    {tier}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !formData.title || !formData.message}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Announcement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
