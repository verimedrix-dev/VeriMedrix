"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { createOrUpdatePayrollRun } from "@/lib/actions/payroll";

type GeneratePayrollButtonProps = {
  month: number;
  year: number;
};

export function GeneratePayrollButton({ month, year }: GeneratePayrollButtonProps) {
  const { refresh } = useRefresh();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await createOrUpdatePayrollRun(month, year);
      refresh();
      toast.success("Payroll generated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate payroll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={loading} size="lg">
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <PlayCircle className="h-4 w-4 mr-2" />
      )}
      Generate Payroll
    </Button>
  );
}
