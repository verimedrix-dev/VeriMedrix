"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Video,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createTutorial,
  updateTutorial,
  deleteTutorial,
  toggleTutorialPublished,
} from "@/lib/actions/tutorials";
import { TUTORIAL_CATEGORY_LABELS, extractYouTubeId, getYouTubeThumbnail } from "@/lib/tutorial-utils";
import type { TutorialCategory } from "@prisma/client";

interface Tutorial {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string | null;
  category: TutorialCategory;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminTutorialsClientProps {
  initialTutorials: Tutorial[];
}

export function AdminTutorialsClient({ initialTutorials }: AdminTutorialsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TutorialCategory>("GETTING_STARTED");
  const [sortOrder, setSortOrder] = useState("0");

  const resetForm = () => {
    setTitle("");
    setYoutubeUrl("");
    setDescription("");
    setCategory("GETTING_STARTED");
    setSortOrder("0");
    setEditingTutorial(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setTitle(tutorial.title);
    setYoutubeUrl(tutorial.youtubeUrl);
    setDescription(tutorial.description || "");
    setCategory(tutorial.category);
    setSortOrder(String(tutorial.sortOrder));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) {
      toast.error("Title and YouTube URL are required");
      return;
    }

    const videoId = extractYouTubeId(youtubeUrl.trim());
    if (!videoId) {
      toast.error("Invalid YouTube URL. Please enter a valid YouTube link.");
      return;
    }

    setLoading(true);
    try {
      if (editingTutorial) {
        await updateTutorial(editingTutorial.id, {
          title: title.trim(),
          youtubeUrl: youtubeUrl.trim(),
          description: description.trim() || null,
          category,
          sortOrder: Number(sortOrder) || 0,
        });
        toast.success("Tutorial updated");
      } else {
        await createTutorial({
          title: title.trim(),
          youtubeUrl: youtubeUrl.trim(),
          description: description.trim() || undefined,
          category,
          sortOrder: Number(sortOrder) || 0,
        });
        toast.success("Tutorial created");
      }
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Failed to save tutorial");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tutorial?")) return;
    try {
      await deleteTutorial(id);
      toast.success("Tutorial deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete tutorial");
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await toggleTutorialPublished(id);
      toast.success("Tutorial visibility updated");
      router.refresh();
    } catch {
      toast.error("Failed to update tutorial");
    }
  };

  // Group tutorials by category
  const grouped = initialTutorials.reduce(
    (acc, tutorial) => {
      const cat = tutorial.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tutorial);
      return acc;
    },
    {} as Record<string, Tutorial[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tutorial Videos</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage YouTube tutorial videos shown to users on the support page
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tutorial
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Videos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialTutorials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Published</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialTutorials.filter(t => t.isPublished).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <EyeOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Unpublished</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialTutorials.filter(t => !t.isPublished).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tutorials Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tutorials</CardTitle>
        </CardHeader>
        <CardContent>
          {initialTutorials.length === 0 ? (
            <div className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No tutorials yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Add YouTube tutorial videos for your users to watch.
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Tutorial
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialTutorials.map((tutorial) => {
                  const thumbnail = getYouTubeThumbnail(tutorial.youtubeUrl);
                  return (
                    <TableRow key={tutorial.id}>
                      <TableCell>
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={tutorial.title}
                            className="w-24 h-14 object-cover rounded"
                          />
                        ) : (
                          <div className="w-24 h-14 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                            <Video className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tutorial.title}</p>
                          {tutorial.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{tutorial.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TUTORIAL_CATEGORY_LABELS[tutorial.category] || tutorial.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{tutorial.sortOrder}</TableCell>
                      <TableCell>
                        {tutorial.isPublished ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(tutorial.youtubeUrl, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open on YouTube
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(tutorial)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePublish(tutorial.id)}>
                              {tutorial.isPublished ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(tutorial.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTutorial ? "Edit Tutorial" : "Add Tutorial"}</DialogTitle>
            <DialogDescription>
              {editingTutorial ? "Update the tutorial details." : "Add a YouTube video tutorial for users."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tutorial-title">Title *</Label>
              <Input
                id="tutorial-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to upload compliance documents"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tutorial-url">YouTube URL *</Label>
              <Input
                id="tutorial-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              {youtubeUrl && !extractYouTubeId(youtubeUrl) && (
                <p className="text-sm text-red-500">Invalid YouTube URL</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tutorial-desc">Description</Label>
              <Textarea
                id="tutorial-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this tutorial covers"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TutorialCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TUTORIAL_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tutorial-order">Sort Order</Label>
                <Input
                  id="tutorial-order"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTutorial ? "Save Changes" : "Add Tutorial"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
