"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Archive, Edit2, Users } from "lucide-react";
import { toast } from "sonner";
import { deleteTrainingModule } from "@/lib/actions/training";

interface TrainingModule {
  id: string;
  name: string;
  description: string | null;
  provider: string | null;
  cpdPoints: number | null;
  validityMonths: number | null;
  isRequired: boolean;
  isActive: boolean;
  _count: {
    EmployeeTrainings: number;
    PositionRequirements: number;
  };
}

interface TrainingModulesListProps {
  modules: TrainingModule[];
}

export function TrainingModulesList({ modules }: TrainingModulesListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleArchive = async (id: string) => {
    setLoading(true);
    try {
      await deleteTrainingModule(id);
      toast.success("Training module archived");
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive module");
    } finally {
      setLoading(false);
    }
  };

  const activeModules = modules.filter(m => m.isActive);
  const archivedModules = modules.filter(m => !m.isActive);

  return (
    <div className="space-y-4">
      {activeModules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">No training modules defined yet.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Create modules to define the trainings your staff need.
          </p>
        </div>
      ) : (
        <div className="divide-y dark:divide-slate-700">
          {activeModules.map((module) => (
            <div key={module.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {module.name}
                    </h4>
                    {module.isRequired && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {module.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {module.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {module.provider && (
                      <Badge variant="outline" className="text-xs">
                        {module.provider}
                      </Badge>
                    )}
                    {module.cpdPoints && (
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">
                        {module.cpdPoints} CPD points
                      </Badge>
                    )}
                    {module.validityMonths && (
                      <Badge variant="secondary" className="text-xs">
                        Valid for {module.validityMonths} months
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs gap-1">
                      <Users className="h-3 w-3" />
                      {module._count.EmployeeTrainings} completions
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Module
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteId(module.id)}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Module
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {archivedModules.length > 0 && (
        <div className="mt-6 pt-6 border-t dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            Archived Modules ({archivedModules.length})
          </h4>
          <div className="space-y-2">
            {archivedModules.map((module) => (
              <div
                key={module.id}
                className="flex items-center justify-between py-2 px-3 rounded bg-slate-100 dark:bg-slate-800 opacity-60"
              >
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {module.name}
                </span>
                <Badge variant="outline" className="text-xs">Archived</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Training Module</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the training module. It will no longer appear
              in the active list but existing training records will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleArchive(deleteId)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
