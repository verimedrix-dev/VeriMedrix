"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { downloadEMP501Report } from "@/lib/actions/sars-reports";

// Inline tax year calculation to avoid importing Prisma-dependent module
function getCurrentTaxYear(month: number, year: number): string {
  if (month >= 3) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

export function EMP501DownloadButton() {
  const [loading, setLoading] = useState(false);
  const [taxYear, setTaxYear] = useState<string | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentTaxYear = getCurrentTaxYear(currentMonth, currentYear);

  // Generate last 5 tax years
  const taxYears: string[] = [];
  const [startYear] = currentTaxYear.split("/").map(Number);
  for (let i = 0; i < 5; i++) {
    const year = startYear - i;
    taxYears.push(`${year}/${year + 1}`);
  }

  const handleDownload = async () => {
    if (!taxYear) {
      toast.error("Please select a tax year");
      return;
    }

    setLoading(true);
    try {
      const csv = await downloadEMP501Report(taxYear);

      // Create and download CSV file
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `EMP501_${taxYear.replace("/", "_")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("EMP501 report downloaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Select
        value={taxYear || ""}
        onValueChange={(value) => setTaxYear(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select tax year" />
        </SelectTrigger>
        <SelectContent>
          {taxYears.map((ty) => (
            <SelectItem key={ty} value={ty}>
              {ty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleDownload} disabled={loading || !taxYear}>
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4 mr-2" />
        )}
        Download
      </Button>
    </div>
  );
}
