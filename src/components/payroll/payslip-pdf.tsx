"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts (optional - using default)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #1e40af",
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: "#64748b",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    color: "#1e3a5f",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "#f1f5f9",
    padding: 6,
    marginBottom: 8,
    color: "#334155",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "1px solid #e2e8f0",
  },
  rowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  label: {
    fontSize: 9,
    color: "#64748b",
  },
  value: {
    fontSize: 9,
    fontWeight: "bold",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 20,
  },
  column: {
    flex: 1,
  },
  earningsTable: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    padding: 6,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #e2e8f0",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  colDescription: {
    flex: 2,
  },
  colAmount: {
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#1e40af",
    marginTop: 10,
  },
  totalLabel: {
    flex: 2,
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 11,
  },
  totalAmount: {
    flex: 1,
    textAlign: "right",
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 11,
  },
  netPayBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#dcfce7",
    borderRadius: 4,
    alignItems: "center",
  },
  netPayLabel: {
    fontSize: 10,
    color: "#166534",
    marginBottom: 4,
  },
  netPayAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#166534",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 10,
  },
  bankingInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  bankingTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#334155",
  },
});

type PayslipData = {
  employeeName: string;
  employeeNumber: string | null;
  idNumber: string | null;
  position: string;
  department: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  payPeriod: string;
  payDate: string;
  grossSalary: number;
  deductions: Array<{
    name: string;
    amount: number;
    isEmployerContribution?: boolean;
  }>;
  totalDeductions: number;
  netPay: number;
  ytdGross?: number;
  ytdDeductions?: number;
  ytdNet?: number;
  companyName?: string;
  companyAddress?: string;
};

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PayslipPDF({ data }: { data: PayslipData }) {
  const employeeDeductions = (data.deductions || []).filter(d => !d.isEmployerContribution);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {data.companyName || "VeriMedrix Healthcare Practice"}
          </Text>
          <Text style={styles.companyDetails}>
            {data.companyAddress || "South Africa"}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>PAYSLIP - {data.payPeriod}</Text>

        {/* Employee & Pay Info */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Employee Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{data.employeeName}</Text>
              </View>
              {data.employeeNumber && (
                <View style={styles.rowAlt}>
                  <Text style={styles.label}>Employee No.</Text>
                  <Text style={styles.value}>{data.employeeNumber}</Text>
                </View>
              )}
              {data.idNumber && (
                <View style={styles.row}>
                  <Text style={styles.label}>ID Number</Text>
                  <Text style={styles.value}>{data.idNumber}</Text>
                </View>
              )}
              <View style={styles.rowAlt}>
                <Text style={styles.label}>Position</Text>
                <Text style={styles.value}>{data.position}</Text>
              </View>
              {data.department && (
                <View style={styles.row}>
                  <Text style={styles.label}>Department</Text>
                  <Text style={styles.value}>{data.department}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Pay Period</Text>
                <Text style={styles.value}>{data.payPeriod}</Text>
              </View>
              <View style={styles.rowAlt}>
                <Text style={styles.label}>Pay Date</Text>
                <Text style={styles.value}>{data.payDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.earningsTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>Description</Text>
              <Text style={styles.colAmount}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colDescription}>Basic Salary</Text>
              <Text style={styles.colAmount}>{formatCurrency(data.grossSalary)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross Pay</Text>
              <Text style={styles.totalAmount}>{formatCurrency(data.grossSalary)}</Text>
            </View>
          </View>
        </View>

        {/* Deductions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.earningsTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>Description</Text>
              <Text style={styles.colAmount}>Amount</Text>
            </View>
            {employeeDeductions.map((deduction, index) => (
              <View
                key={index}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.colDescription}>{deduction.name}</Text>
                <Text style={styles.colAmount}>{formatCurrency(deduction.amount)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Deductions</Text>
              <Text style={styles.totalAmount}>{formatCurrency(data.totalDeductions)}</Text>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>NET PAY</Text>
          <Text style={styles.netPayAmount}>{formatCurrency(data.netPay)}</Text>
        </View>

        {/* Banking Info */}
        {data.bankName && (
          <View style={styles.bankingInfo}>
            <Text style={styles.bankingTitle}>Payment will be made to:</Text>
            <Text style={{ fontSize: 9, marginBottom: 2 }}>
              Bank: {data.bankName}
            </Text>
            {data.bankAccountNumber && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>
                Account: ****{data.bankAccountNumber.slice(-4)}
              </Text>
            )}
            {data.bankBranchCode && (
              <Text style={{ fontSize: 9 }}>
                Branch Code: {data.bankBranchCode}
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated document. Please retain for your records.
          </Text>
          <Text style={{ marginTop: 4 }}>
            Generated by VeriMedrix Payroll System
          </Text>
        </View>
      </Page>
    </Document>
  );
}
