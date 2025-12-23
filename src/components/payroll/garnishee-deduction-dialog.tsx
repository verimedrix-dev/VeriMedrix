"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Scale, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addGarnisheeDeduction,
  removeGarnisheeDeduction,
  getEmployeeGarnisheeDeductions,
} from "@/lib/actions/payroll";

const formSchema = z.object({
  name: z.string().min(1, "Court case/reference is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});

type FormValues = {
  name: string;
  amount: number;
};

type GarnisheeDeductionDialogProps = {
  employeeId: string;
  employeeName: string;
};

type GarnisheeDeduction = {
  id: string;
  name: string | null;
  amount: number | null;
  isActive: boolean;
};

export function GarnisheeDeductionDialog({
  employeeId,
  employeeName,
}: GarnisheeDeductionDialogProps) {
  const [open, setOpen] = useState(false);
  const [deductions, setDeductions] = useState<GarnisheeDeduction[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
    },
  });

  async function loadDeductions() {
    try {
      const data = await getEmployeeGarnisheeDeductions(employeeId);
      setDeductions(data);
    } catch (error) {
      toast.error("Failed to load garnishee deductions");
    }
  }

  useEffect(() => {
    if (open) {
      loadDeductions();
    }
  }, [open, employeeId]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await addGarnisheeDeduction({
        employeeId,
        name: values.name,
        amount: values.amount,
      });

      toast.success("Garnishee deduction added successfully");
      form.reset();
      loadDeductions();
    } catch (error) {
      toast.error("Failed to add garnishee deduction");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(deductionId: string) {
    try {
      await removeGarnisheeDeduction(deductionId);
      toast.success("Garnishee deduction removed");
      loadDeductions();
    } catch (error) {
      toast.error("Failed to remove garnishee deduction");
    }
  }

  const totalMonthly = deductions
    .filter((d) => d.isActive)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Scale className="h-4 w-4 mr-2" />
          Garnishee Orders
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Garnishee Deductions - {employeeName}</DialogTitle>
          <DialogDescription>
            Manage court-ordered deductions and garnishee orders for this employee
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Deduction Form */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Garnishee Order
            </h4>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Case / Reference Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Case #12345 - Debt Collection" {...field} />
                      </FormControl>
                      <FormDescription>
                        Reference number or description of the court order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Deduction Amount (R)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Fixed amount to deduct each month as per court order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Garnishee Deduction"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Existing Deductions List */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Active Garnishee Orders</h4>

            {deductions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Scale className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No garnishee orders for this employee</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Court Case / Reference</TableHead>
                      <TableHead className="text-right">Monthly Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map((deduction) => (
                      <TableRow key={deduction.id}>
                        <TableCell className="font-medium">{deduction.name}</TableCell>
                        <TableCell className="text-right">
                          R {Number(deduction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {deduction.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(deduction.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Monthly Deductions:</span>
                    <span className="text-xl font-bold text-red-600">
                      R {totalMonthly.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> Garnishee orders are court-mandated deductions that must be
              processed before any other deductions. Ensure you have the proper documentation before
              adding these deductions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
