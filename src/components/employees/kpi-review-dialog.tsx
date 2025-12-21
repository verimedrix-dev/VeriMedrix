"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createKpiReview } from "@/lib/actions/employees";

type KpiReviewDialogProps = {
  employeeId: string;
  employeeName: string;
  existingReviews: Array<{ quarter: number; year: number }>;
};

export function KpiReviewDialog({ employeeId, employeeName, existingReviews }: KpiReviewDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [formData, setFormData] = useState({
    quarter: currentQuarter.toString(),
    year: currentYear.toString(),
  });

  // Generate year options (current year and next year)
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Check if a review already exists for selected quarter/year
  const reviewExists = existingReviews.some(
    (r) => r.quarter === parseInt(formData.quarter) && r.year === parseInt(formData.year)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.quarter || !formData.year) {
      toast.error("Please select quarter and year");
      return;
    }

    if (reviewExists) {
      toast.error("A review for this quarter already exists");
      return;
    }

    setLoading(true);

    try {
      await createKpiReview({
        employeeId,
        quarter: parseInt(formData.quarter),
        year: parseInt(formData.year),
      });

      setOpen(false);
      refresh();
      toast.success("KPI review created successfully!");
    } catch {
      toast.error("Failed to create KPI review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Quarter Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create KPI Review</DialogTitle>
            <DialogDescription>
              Start a new quarterly performance review for {employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quarter">Quarter *</Label>
                <Select
                  value={formData.quarter}
                  onValueChange={(value) =>
                    setFormData({ ...formData, quarter: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                    <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) =>
                    setFormData({ ...formData, year: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {reviewExists && (
              <p className="text-sm text-red-600">
                A review for Q{formData.quarter} {formData.year} already exists
              </p>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                After creating the review, you can add specific performance goals
                for the employee to work towards.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || reviewExists}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
