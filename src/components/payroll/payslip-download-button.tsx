"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { PayslipPDF } from "./payslip-pdf";
import { toast } from "sonner";
import { getPayslipData } from "@/lib/actions/payroll";

type PayslipDownloadButtonProps = {
  payrollEntryId: string;
  employeeName: string;
  month: number;
  year: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PayslipDownloadButton({
  payrollEntryId,
  employeeName,
  month,
  year,
  variant = "outline",
  size = "sm",
}: PayslipDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const data = await getPayslipData(payrollEntryId);

      if (!data) {
        throw new Error("Failed to load payslip data");
      }

      const payslipData = {
        employeeName: data.employeeName,
        employeeNumber: data.employeeNumber,
        idNumber: data.idNumber,
        taxNumber: data.taxNumber ?? null,
        position: data.position,
        department: data.department,
        employmentDate: data.employmentDate,
        employeeAddress: data.employeeAddress,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankBranchCode: data.bankBranchCode,
        payPeriod: `${monthNames[month - 1]} ${year}`,
        payDate: `${year}-${String(month).padStart(2, "0")}-25`,
        grossSalary: data.grossSalary,
        basicSalary: data.basicSalary,
        allowances: data.allowances || [], // Bonuses, overtime, commission, etc.
        deductions: data.deductions || [],
        totalDeductions: data.totalDeductions,
        netPay: data.netPay,
        // Employer contributions
        employerUIF: data.employerUIF,
        employerSDL: data.employerSDL,
        // YTD figures
        ytdGross: data.ytdGross,
        ytdPaye: data.ytdPaye,
        ytdUif: data.ytdUif,
        ytdDeductions: data.ytdDeductions,
        ytdNet: data.ytdNet,
        ytdEmployerUIF: data.ytdEmployerUIF,
        ytdEmployerSDL: data.ytdEmployerSDL,
        // Leave
        leaveBalances: data.leaveBalances,
        companyName: data.companyName,
        companyAddress: data.companyAddress ?? undefined,
      };

      const blob = await pdf(<PayslipPDF data={payslipData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${employeeName.replace(/\s+/g, "-").toLowerCase()}-${year}-${String(month).padStart(2, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Payslip downloaded");
    } catch (error) {
      console.error("Failed to generate payslip:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate payslip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <FileText className="h-4 w-4 mr-1" />
          Payslip
        </>
      )}
    </Button>
  );
}
