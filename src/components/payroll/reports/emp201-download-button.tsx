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
import { downloadEMP201Report } from "@/lib/actions/sars-reports";

export function EMP201DownloadButton() {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleDownload = async () => {
    if (!month || !year) {
      toast.error("Please select both month and year");
      return;
    }

    setLoading(true);
    try {
      const csv = await downloadEMP201Report(month, year);

      // Create and download CSV file
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `EMP201_${year}_${String(month).padStart(2, "0")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("EMP201 report downloaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Select
        value={month?.toString()}
        onValueChange={(value) => setMonth(parseInt(value))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value.toString()}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={year?.toString()}
        onValueChange={(value) => setYear(parseInt(value))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleDownload} disabled={loading || !month || !year}>
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
