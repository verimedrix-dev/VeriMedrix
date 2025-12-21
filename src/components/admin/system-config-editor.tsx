"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSystemConfig } from "@/lib/actions/admin/system";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";

interface SystemConfigEditorProps {
  config: {
    id: string;
    key: string;
    value: string;
    description: string | null;
    isSecret: boolean;
  };
}

export function SystemConfigEditor({ config }: SystemConfigEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(config.value);
  const [showSecret, setShowSecret] = useState(false);
  const router = useRouter();

  const hasChanges = value !== config.value;

  const handleSave = () => {
    startTransition(async () => {
      await updateSystemConfig(config.key, value, config.description || undefined);
      router.refresh();
    });
  };

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
              {config.key}
            </span>
          </div>
          {config.description && (
            <p className="text-sm text-slate-500 mt-1">{config.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              type={config.isSecret && !showSecret ? "password" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-64 font-mono text-sm"
            />
            {config.isSecret && (
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
