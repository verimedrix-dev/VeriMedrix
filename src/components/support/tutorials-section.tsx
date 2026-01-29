"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Play, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { TUTORIAL_CATEGORY_LABELS, getYouTubeEmbedUrl, getYouTubeThumbnail } from "@/lib/tutorial-utils";

interface Tutorial {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string | null;
  category: string;
}

interface TutorialsSectionProps {
  tutorials: Tutorial[];
}

const ITEMS_PER_PAGE = 3;

export function TutorialsSection({ tutorials }: TutorialsSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  if (tutorials.length === 0) return null;

  const categories = Array.from(new Set(tutorials.map((t) => t.category)));

  const filteredTutorials = useMemo(() => {
    let result = tutorials;

    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tutorials, activeCategory, searchQuery]);

  const totalPages = Math.ceil(filteredTutorials.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const visibleTutorials = filteredTutorials.slice(
    safePage * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat: string | null) => {
    setActiveCategory(cat);
    setCurrentPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
  };

  const embedUrl = selectedVideo ? getYouTubeEmbedUrl(selectedVideo.youtubeUrl) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Video className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle>Video Tutorials</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Learn how to use the system with step-by-step guides
              </p>
            </div>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(null)}
            >
              All ({tutorials.length})
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(cat)}
              >
                {TUTORIAL_CATEGORY_LABELS[cat] || cat} ({tutorials.filter((t) => t.category === cat).length})
              </Button>
            ))}
          </div>
        )}

        {/* Video Player (when a video is selected) */}
        {selectedVideo && embedUrl && (
          <div className="rounded-lg overflow-hidden border bg-black">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
              <p className="text-sm font-medium text-white truncate">{selectedVideo.title}</p>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-slate-800" onClick={() => setSelectedVideo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`${embedUrl}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Video Carousel */}
        {filteredTutorials.length === 0 ? (
          <div className="py-8 text-center">
            <Video className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tutorials found{searchQuery ? ` for "${searchQuery}"` : ""}.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTutorials.map((tutorial) => {
                const thumbnail = getYouTubeThumbnail(tutorial.youtubeUrl);
                const isPlaying = selectedVideo?.id === tutorial.id;
                return (
                  <button
                    key={tutorial.id}
                    onClick={() => setSelectedVideo(isPlaying ? null : tutorial)}
                    className={`text-left rounded-lg border overflow-hidden hover:shadow-md transition-all group ${
                      isPlaying ? "ring-2 ring-blue-500 border-blue-500" : "hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="relative">
                      {thumbnail ? (
                        <img src={thumbnail} alt={tutorial.title} className="w-full aspect-video object-cover" />
                      ) : (
                        <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Video className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-slate-900 ml-0.5" />
                        </div>
                      </div>
                      {isPlaying && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-blue-600 text-white">Playing</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2">
                        {tutorial.title}
                      </p>
                      {tutorial.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {tutorial.description}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2 text-xs">
                        {TUTORIAL_CATEGORY_LABELS[tutorial.category] || tutorial.category}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Carousel Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {safePage * ITEMS_PER_PAGE + 1}–{Math.min((safePage + 1) * ITEMS_PER_PAGE, filteredTutorials.length)} of {filteredTutorials.length} videos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage === 0}
                    onClick={() => setCurrentPage(safePage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === safePage
                            ? "w-6 bg-red-500"
                            : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setCurrentPage(safePage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
