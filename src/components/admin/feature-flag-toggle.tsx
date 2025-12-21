"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateFeatureFlag } from "@/lib/actions/admin/system";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface FeatureFlagToggleProps {
  flag: {
    id: string;
    name: string;
    isEnabled: boolean;
    enabledForAll: boolean;
  };
}

export function FeatureFlagToggle({ flag }: FeatureFlagToggleProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      await updateFeatureFlag(flag.id, { isEnabled: checked });
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      <Switch
        checked={flag.isEnabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}
