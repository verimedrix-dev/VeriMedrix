"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createServiceProviderAdmin, updateServiceProviderAdmin } from "@/lib/actions/admin/service-providers";
import type { ProviderData } from "@/components/service-providers/provider-card";

const SA_PROVINCES = [
  { value: "GP", label: "Gauteng" },
  { value: "WC", label: "Western Cape" },
  { value: "KZN", label: "KwaZulu-Natal" },
  { value: "EC", label: "Eastern Cape" },
  { value: "FS", label: "Free State" },
  { value: "LP", label: "Limpopo" },
  { value: "MP", label: "Mpumalanga" },
  { value: "NW", label: "North West" },
  { value: "NC", label: "Northern Cape" },
];

type Category = {
  id: string;
  name: string;
};

type AdminProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  editProvider?: ProviderData | null;
};

export function AdminProviderDialog({
  open,
  onOpenChange,
  categories,
  editProvider,
}: AdminProviderDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editProvider?.name || "",
    categoryId: editProvider?.categoryId || "",
    description: editProvider?.description || "",
    phone: editProvider?.phone || "",
    email: editProvider?.email || "",
    website: editProvider?.website || "",
    address: editProvider?.address || "",
    city: editProvider?.city || "",
    province: editProvider?.province || "",
  });

  const resetForm = (provider?: ProviderData | null) => {
    setFormData({
      name: provider?.name || "",
      categoryId: provider?.categoryId || "",
      description: provider?.description || "",
      phone: provider?.phone || "",
      email: provider?.email || "",
      website: provider?.website || "",
      address: provider?.address || "",
      city: provider?.city || "",
      province: provider?.province || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.categoryId) {
      toast.error("Name and category are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        description: formData.description || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        province: formData.province || null,
        logoUrl: editProvider?.logoUrl || null,
      };

      if (editProvider) {
        await updateServiceProviderAdmin(editProvider.id, payload);
        toast.success("Provider updated successfully");
      } else {
        await createServiceProviderAdmin(payload);
        toast.success("Provider added successfully");
      }

      resetForm();
      onOpenChange(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save provider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editProvider ? "Edit Provider" : "Add Service Provider"}</DialogTitle>
            <DialogDescription>
              {editProvider
                ? "Update the service provider details"
                : "Add a new service provider to the directory"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. MedWaste Solutions"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of services offered..."
                rows={3}
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="012 345 6789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.co.za"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="www.company.co.za"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            {/* City & Province */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Pretoria"
                />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => setFormData({ ...formData, province: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_PROVINCES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isPending}>
              {(loading || isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editProvider ? "Save Changes" : "Add Provider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
