"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TutorialCategory } from "@prisma/client";

// Get all published tutorials (for user-facing support page)
export async function getPublishedTutorials() {
  const tutorials = await prisma.tutorial.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return tutorials;
}

// Get all tutorials (for admin)
export async function getAllTutorials() {
  const tutorials = await prisma.tutorial.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return tutorials;
}

// Create a tutorial (admin)
export async function createTutorial(data: {
  title: string;
  youtubeUrl: string;
  description?: string;
  category: TutorialCategory;
  sortOrder?: number;
}) {
  const tutorial = await prisma.tutorial.create({
    data: {
      title: data.title,
      youtubeUrl: data.youtubeUrl,
      description: data.description || null,
      category: data.category,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  revalidatePath("/admin/tutorials");
  revalidatePath("/support");
  return tutorial;
}

// Update a tutorial (admin)
export async function updateTutorial(
  id: string,
  data: {
    title?: string;
    youtubeUrl?: string;
    description?: string | null;
    category?: TutorialCategory;
    sortOrder?: number;
    isPublished?: boolean;
  }
) {
  const tutorial = await prisma.tutorial.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/tutorials");
  revalidatePath("/support");
  return tutorial;
}

// Delete a tutorial (admin)
export async function deleteTutorial(id: string) {
  await prisma.tutorial.delete({ where: { id } });
  revalidatePath("/admin/tutorials");
  revalidatePath("/support");
}

// Toggle publish status (admin)
export async function toggleTutorialPublished(id: string) {
  const tutorial = await prisma.tutorial.findUnique({ where: { id } });
  if (!tutorial) throw new Error("Tutorial not found");

  await prisma.tutorial.update({
    where: { id },
    data: { isPublished: !tutorial.isPublished },
  });

  revalidatePath("/admin/tutorials");
  revalidatePath("/support");
}
