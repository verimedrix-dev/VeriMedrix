"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { ProviderCard, type ProviderData } from "@/components/service-providers/provider-card";
import { CategoryFilter } from "@/components/service-providers/category-filter";
import { AdminProviderDialog } from "./admin-provider-dialog";
import { deleteServiceProviderAdmin } from "@/lib/actions/admin/service-providers";

type Category = {
  id: string;
  name: string;
  description: string | null;
  providerCount: number;
};

type AdminServiceProvidersClientProps = {
  providers: ProviderData[];
  categories: Category[];
  totalProviders: number;
};

export function AdminServiceProvidersClient({
  providers,
  categories,
  totalProviders,
}: AdminServiceProvidersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<ProviderData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProviderData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = providers.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (provider: ProviderData) => {
    setEditProvider(provider);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteServiceProviderAdmin(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed from directory`);
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete provider");
    } finally {
      setDeleting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditProvider(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Service Provider Directory
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage service providers visible to all practices
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search providers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        totalProviders={totalProviders}
      />

      {/* Provider Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {search || selectedCategory
              ? "No providers match your search"
              : "No service providers listed yet"}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {search || selectedCategory
              ? "Try adjusting your search or filter"
              : "Click \"Add Provider\" to add the first one"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isSuperAdmin={true}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AdminProviderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        categories={categories}
        editProvider={editProvider}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the provider from the directory. This action can be undone by re-adding the provider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
