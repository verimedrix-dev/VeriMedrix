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
import { downloadIRP5Certificate } from "@/lib/actions/sars-reports";

// Inline tax year calculation to avoid importing Prisma-dependent module
function getCurrentTaxYear(month: number, year: number): string {
  if (month >= 3) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

type Employee = {
  id: string;
  fullName: string;
  employeeNumber: string | null;
};

type IRP5DownloadButtonProps = {
  employees: Employee[];
};

export function IRP5DownloadButton({ employees }: IRP5DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
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
    if (!employeeId || !taxYear) {
      toast.error("Please select both employee and tax year");
      return;
    }

    setLoading(true);
    try {
      const certificate = await downloadIRP5Certificate(employeeId, taxYear);

      // Create simple text format for now (can be enhanced to PDF later)
      const text = `
IRP5/IT3(a) - TAX CERTIFICATE

CERTIFICATE NUMBER: ${certificate.certificateNumber}
TAX YEAR: ${certificate.taxYear}
PERIOD: ${certificate.period.startDate} to ${certificate.period.endDate}

=== EMPLOYEE DETAILS ===
Name: ${certificate.employee.fullName}
Employee Number: ${certificate.employee.employeeNumber || "N/A"}
Tax Number: ${certificate.employee.taxNumber || "N/A"}
Date of Birth: ${certificate.employee.dateOfBirth ? new Date(certificate.employee.dateOfBirth).toLocaleDateString() : "N/A"}

=== EMPLOYER DETAILS ===
Name: ${certificate.employer.name}
Practice Number: ${certificate.employer.practiceNumber || "N/A"}
Address: ${certificate.employer.address || "N/A"}

=== INCOME ===
Gross Remuneration: R ${certificate.income.grossRemuneration.toFixed(2)}
Taxable Income: R ${certificate.income.taxableIncome.toFixed(2)}
Fringe Benefits: R ${certificate.income.fringeBenefits.toFixed(2)}

=== DEDUCTIONS ===
PAYE: R ${certificate.deductions.paye.toFixed(2)}
UIF: R ${certificate.deductions.uif.toFixed(2)}
Pension Fund: R ${certificate.deductions.pensionFund.toFixed(2)}
Retirement Annuity: R ${certificate.deductions.retirementAnnuity.toFixed(2)}
Medical Aid: R ${certificate.deductions.medicalAid.toFixed(2)}

=== TAX CREDITS ===
Medical Tax Credits: R ${certificate.taxCredits.medicalTaxCredits.toFixed(2)}

Generated: ${certificate.generatedAt.toLocaleString()}
      `.trim();

      // Download as text file
      const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const employee = employees.find((e) => e.id === employeeId);
      const employeeName = employee?.fullName.replace(/\s+/g, "_") || "Employee";
      link.setAttribute("href", url);
      link.setAttribute("download", `IRP5_${employeeName}_${taxYear.replace("/", "_")}.txt`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("IRP5 certificate downloaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={employeeId || ""}
          onValueChange={(value) => setEmployeeId(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.fullName}
                {emp.employeeNumber && ` (${emp.employeeNumber})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={taxYear || ""}
          onValueChange={(value) => setTaxYear(value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tax year" />
          </SelectTrigger>
          <SelectContent>
            {taxYears.map((ty) => (
              <SelectItem key={ty} value={ty}>
                {ty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleDownload} disabled={loading || !employeeId || !taxYear}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Download
        </Button>
      </div>
    </div>
  );
}
