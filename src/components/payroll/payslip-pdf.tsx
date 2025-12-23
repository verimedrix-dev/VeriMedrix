"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottom: "2px solid #0ea5e9",
    paddingBottom: 10,
  },
  companyNameBox: {
    flex: 1,
  },
  companyNameLarge: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0ea5e9",
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 8,
    color: "#64748b",
  },
  payslipTitle: {
    textAlign: "right",
    alignSelf: "center",
  },
  payslipTitleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  // Info sections
  infoContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 15,
  },
  infoBox: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 100,
    fontSize: 8,
    color: "#64748b",
    fontWeight: "bold",
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
    color: "#1e293b",
  },
  // Tables
  mainContent: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  tableSection: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0ea5e9",
    padding: 5,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  tableHeaderDesc: {
    flex: 2,
  },
  tableHeaderCurrent: {
    flex: 1,
    textAlign: "right",
  },
  tableHeaderYTD: {
    flex: 1,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    borderBottom: "1px solid #e2e8f0",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 4,
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  tableRowTotal: {
    flexDirection: "row",
    padding: 5,
    backgroundColor: "#e2e8f0",
    fontWeight: "bold",
  },
  cellDesc: {
    flex: 2,
    fontSize: 8,
  },
  cellCurrent: {
    flex: 1,
    textAlign: "right",
    fontSize: 8,
  },
  cellYTD: {
    flex: 1,
    textAlign: "right",
    fontSize: 8,
    color: "#64748b",
  },
  // Employer contributions
  employerSection: {
    marginBottom: 10,
  },
  // Leave balances
  leaveSection: {
    marginBottom: 15,
  },
  leaveHeader: {
    flexDirection: "row",
    backgroundColor: "#0ea5e9",
    padding: 5,
  },
  leaveHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  leaveColType: {
    flex: 2,
  },
  leaveColBalance: {
    flex: 1,
    textAlign: "right",
  },
  leaveColAdjmt: {
    flex: 1,
    textAlign: "right",
  },
  leaveColTaken: {
    flex: 1,
    textAlign: "right",
  },
  leaveColSched: {
    flex: 1,
    textAlign: "right",
  },
  // Net Pay
  netPayContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 15,
    borderTop: "2px solid #1e293b",
    paddingTop: 10,
  },
  netPayLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e293b",
    marginRight: 20,
  },
  netPayAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7,
    color: "#94a3b8",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 8,
  },
  footerLogo: {
    fontSize: 8,
    color: "#0ea5e9",
    marginTop: 4,
  },
});

export type PayslipData = {
  employeeName: string;
  employeeNumber: string | null;
  idNumber: string | null;
  taxNumber: string | null;
  position: string;
  department: string | null;
  employmentDate?: string | null;
  employeeAddress?: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  accountType?: string | null;
  payPeriod: string;
  payDate: string;
  // Income
  grossSalary: number;
  basicSalary?: number;
  hourlyRate?: number;
  hoursWorked?: number;
  overtime?: number;
  sundayPay?: number;
  holidayPay?: number;
  // Allowances
  allowances?: Array<{
    name: string;
    amount: number;
  }>;
  // Deductions
  deductions: Array<{
    name: string;
    amount: number;
    isEmployerContribution?: boolean;
  }>;
  totalDeductions: number;
  netPay: number;
  // Employer contributions
  employerUIF?: number;
  employerSDL?: number;
  // YTD figures
  ytdGross?: number;
  ytdPaye?: number;
  ytdUif?: number;
  ytdDeductions?: number;
  ytdNet?: number;
  ytdEmployerUIF?: number;
  ytdEmployerSDL?: number;
  // Leave
  leaveBalances?: {
    annual: number;
    sick: number;
    family: number;
    annualAdjustment?: number;
    sickAdjustment?: number;
    familyAdjustment?: number;
    annualTaken?: number;
    sickTaken?: number;
    familyTaken?: number;
    annualScheduled?: number;
    sickScheduled?: number;
    familyScheduled?: number;
  };
  companyName?: string;
  companyAddress?: string;
};

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "0.00";
  return amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PayslipPDF({ data }: { data: PayslipData }) {
  const employeeDeductions = (data.deductions || []).filter(d => !d.isEmployerContribution);

  // Calculate totals
  const totalAllowances = (data.allowances || []).reduce((sum, a) => sum + a.amount, 0);
  const totalIncome = data.grossSalary;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyNameBox}>
            <Text style={styles.companyNameLarge}>
              {data.companyName || "Company Name"}
            </Text>
            {data.companyAddress && (
              <Text style={styles.companyAddress}>{data.companyAddress}</Text>
            )}
          </View>
          <View style={styles.payslipTitle}>
            <Text style={styles.payslipTitleText}>PAYSLIP</Text>
          </View>
        </View>

        {/* Employee Info & Banking Details */}
        <View style={styles.infoContainer}>
          {/* Left - Employee Details */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee Name</Text>
              <Text style={styles.infoValue}>{data.employeeName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Period</Text>
              <Text style={styles.infoValue}>{data.payPeriod}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee Number</Text>
              <Text style={styles.infoValue}>{data.employeeNumber || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Income Tax Number</Text>
              <Text style={styles.infoValue}>{data.taxNumber || "N/A"}</Text>
            </View>
            {data.employmentDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employment Date</Text>
                <Text style={styles.infoValue}>{data.employmentDate}</Text>
              </View>
            )}
          </View>

          {/* Right - Address & Banking */}
          <View style={styles.infoBox}>
            {data.employeeAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employee Address</Text>
                <Text style={styles.infoValue}>{data.employeeAddress}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account number</Text>
              <Text style={styles.infoValue}>{data.bankAccountNumber || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Branch code</Text>
              <Text style={styles.infoValue}>{data.bankBranchCode || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account type</Text>
              <Text style={styles.infoValue}>{data.accountType || "Current"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank</Text>
              <Text style={styles.infoValue}>{data.bankName || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Main Content - Two Columns */}
        <View style={styles.mainContent}>
          {/* Left Column - Income & Allowances & Deductions */}
          <View style={styles.leftColumn}>
            {/* Income Section */}
            <View style={styles.tableSection}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableHeaderDesc]}>Income</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderCurrent]}>Current</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderYTD]}>YTD</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cellDesc}>Basic Salary</Text>
                <Text style={styles.cellCurrent}>{formatCurrency(data.basicSalary || data.grossSalary)}</Text>
                <Text style={styles.cellYTD}>{formatCurrency(data.ytdGross)}</Text>
              </View>
              {data.overtime && data.overtime > 0 && (
                <View style={styles.tableRowAlt}>
                  <Text style={styles.cellDesc}>Overtime</Text>
                  <Text style={styles.cellCurrent}>{formatCurrency(data.overtime)}</Text>
                  <Text style={styles.cellYTD}>-</Text>
                </View>
              )}
              {data.sundayPay && data.sundayPay > 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.cellDesc}>Sunday Pay</Text>
                  <Text style={styles.cellCurrent}>{formatCurrency(data.sundayPay)}</Text>
                  <Text style={styles.cellYTD}>-</Text>
                </View>
              )}
              {data.holidayPay && data.holidayPay > 0 && (
                <View style={styles.tableRowAlt}>
                  <Text style={styles.cellDesc}>Holiday Pay</Text>
                  <Text style={styles.cellCurrent}>{formatCurrency(data.holidayPay)}</Text>
                  <Text style={styles.cellYTD}>-</Text>
                </View>
              )}
              <View style={styles.tableRowTotal}>
                <Text style={styles.cellDesc}>Total Income</Text>
                <Text style={styles.cellCurrent}>{formatCurrency(totalIncome)}</Text>
                <Text style={styles.cellYTD}>{formatCurrency(data.ytdGross)}</Text>
              </View>
            </View>

            {/* Additional Earnings Section (Bonuses, Overtime, etc.) */}
            {data.allowances && data.allowances.length > 0 && (
              <View style={styles.tableSection}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.tableHeaderDesc]}>Additional Earnings</Text>
                  <Text style={[styles.tableHeaderText, styles.tableHeaderCurrent]}>Current</Text>
                  <Text style={[styles.tableHeaderText, styles.tableHeaderYTD]}>YTD</Text>
                </View>
                {data.allowances.map((allowance, index) => (
                  <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.cellDesc}>{allowance.name}</Text>
                    <Text style={styles.cellCurrent}>{formatCurrency(allowance.amount)}</Text>
                    <Text style={styles.cellYTD}>-</Text>
                  </View>
                ))}
                <View style={styles.tableRowTotal}>
                  <Text style={styles.cellDesc}>Total Additional</Text>
                  <Text style={styles.cellCurrent}>{formatCurrency(totalAllowances)}</Text>
                  <Text style={styles.cellYTD}>-</Text>
                </View>
              </View>
            )}

            {/* Deductions Section */}
            <View style={styles.tableSection}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableHeaderDesc]}>Deduction</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderCurrent]}>Current</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderYTD]}>YTD</Text>
              </View>
              {employeeDeductions.map((deduction, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.cellDesc}>{deduction.name}</Text>
                  <Text style={styles.cellCurrent}>{formatCurrency(deduction.amount)}</Text>
                  <Text style={styles.cellYTD}>-</Text>
                </View>
              ))}
              <View style={styles.tableRowTotal}>
                <Text style={styles.cellDesc}>Total Deductions</Text>
                <Text style={styles.cellCurrent}>{formatCurrency(data.totalDeductions)}</Text>
                <Text style={styles.cellYTD}>{formatCurrency(data.ytdDeductions)}</Text>
              </View>
            </View>
          </View>

          {/* Right Column - Employer Contributions */}
          <View style={styles.rightColumn}>
            {/* Employer Contribution Section */}
            <View style={styles.employerSection}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableHeaderDesc]}>Employer Contribution</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderCurrent]}>Current</Text>
                <Text style={[styles.tableHeaderText, styles.tableHeaderYTD]}>YTD</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cellDesc}>UIF - Employer</Text>
                <Text style={styles.cellCurrent}>{formatCurrency(data.employerUIF)}</Text>
                <Text style={styles.cellYTD}>{formatCurrency(data.ytdEmployerUIF)}</Text>
              </View>
              <View style={styles.tableRowAlt}>
                <Text style={styles.cellDesc}>SDL - Employer</Text>
                <Text style={styles.cellCurrent}>{formatCurrency(data.employerSDL)}</Text>
                <Text style={styles.cellYTD}>{formatCurrency(data.ytdEmployerSDL)}</Text>
              </View>
              <View style={styles.tableRowTotal}>
                <Text style={styles.cellDesc}>Total Employer Contrib.</Text>
                <Text style={styles.cellCurrent}>{formatCurrency((data.employerUIF || 0) + (data.employerSDL || 0))}</Text>
                <Text style={styles.cellYTD}>{formatCurrency((data.ytdEmployerUIF || 0) + (data.ytdEmployerSDL || 0))}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Leave Balances Section */}
        {data.leaveBalances && (
          <View style={styles.leaveSection}>
            <View style={styles.leaveHeader}>
              <Text style={[styles.leaveHeaderText, styles.leaveColType]}>Leave Type</Text>
              <Text style={[styles.leaveHeaderText, styles.leaveColBalance]}>Balance</Text>
              <Text style={[styles.leaveHeaderText, styles.leaveColAdjmt]}>Adjmt.</Text>
              <Text style={[styles.leaveHeaderText, styles.leaveColTaken]}>Taken</Text>
              <Text style={[styles.leaveHeaderText, styles.leaveColSched]}>Sched.</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.leaveColType}>Annual</Text>
              <Text style={styles.leaveColBalance}>{data.leaveBalances.annual.toFixed(2)}</Text>
              <Text style={styles.leaveColAdjmt}>{(data.leaveBalances.annualAdjustment || 0).toFixed(2)}</Text>
              <Text style={styles.leaveColTaken}>{(data.leaveBalances.annualTaken || 0).toFixed(2)}</Text>
              <Text style={styles.leaveColSched}>{(data.leaveBalances.annualScheduled || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.tableRowAlt}>
              <Text style={styles.leaveColType}>Sick</Text>
              <Text style={styles.leaveColBalance}>{data.leaveBalances.sick.toFixed(2)}</Text>
              <Text style={styles.leaveColAdjmt}>{(data.leaveBalances.sickAdjustment || 0).toFixed(2)}</Text>
              <Text style={styles.leaveColTaken}>{(data.leaveBalances.sickTaken || 0).toFixed(2)}</Text>
              <Text style={styles.leaveColSched}>{(data.leaveBalances.sickScheduled || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.leaveColType}>Family Responsibility</Text>
              <Text style={styles.leaveColBalance}>{data.leaveBalances.family.toFixed(2)}</Text>
              <Text style={styles.leaveColAdjmt}>{(data.leaveBalances.familyAdjustment || 0).toFixed(2)}</Text>
              <Text style={styles.leaveColTaken}>{(data.leaveBalances.familyTaken || 0).toFixed(2)}</Text>
              <Text style={styles.leaveColSched}>{(data.leaveBalances.familyScheduled || 0).toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Net Pay */}
        <View style={styles.netPayContainer}>
          <Text style={styles.netPayLabel}>NETT PAY</Text>
          <Text style={styles.netPayAmount}>R {formatCurrency(data.netPay)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated payslip. Please retain for your records.
          </Text>
          <Text style={styles.footerLogo}>
            VeriMedrix Payroll
          </Text>
        </View>
      </Page>
    </Document>
  );
}
