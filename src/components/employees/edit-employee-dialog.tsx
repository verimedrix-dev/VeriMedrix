"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateEmployee } from "@/lib/actions/employees";
import { EmploymentType } from "@prisma/client";

interface EditEmployeeDialogProps {
  employeeId: string;
  employee: {
    fullName: string;
    position: string;
    email?: string | null;
    phone?: string | null;
    idNumber?: string | null;
    address?: string | null;
    dateOfBirth?: Date | null;
    employeeNumber?: string | null;
    department?: string | null;
    hireDate?: Date | null;
    terminationDate?: Date | null;
    employmentType?: EmploymentType;
    isActive?: boolean;
  };
  /** Only owners can see employment details like hire date, termination date, status */
  showEmploymentSection?: boolean;
}

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function EditEmployeeDialog({
  employeeId,
  employee,
  showEmploymentSection = true,
}: EditEmployeeDialogProps) {
  const { refresh, isPending } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(employee.fullName);
  const [position, setPosition] = useState(employee.position);
  const [email, setEmail] = useState(employee.email || "");
  const [phone, setPhone] = useState(employee.phone || "");
  const [idNumber, setIdNumber] = useState(employee.idNumber || "");
  const [address, setAddress] = useState(employee.address || "");
  const [dateOfBirth, setDateOfBirth] = useState(formatDateForInput(employee.dateOfBirth));
  const [employeeNumber, setEmployeeNumber] = useState(employee.employeeNumber || "");
  const [department, setDepartment] = useState(employee.department || "");
  const [hireDate, setHireDate] = useState(formatDateForInput(employee.hireDate));
  const [terminationDate, setTerminationDate] = useState(formatDateForInput(employee.terminationDate));
  const [employmentType, setEmploymentType] = useState<EmploymentType>(employee.employmentType || "PERMANENT");
  const [isActive, setIsActive] = useState(employee.isActive !== false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!position.trim()) {
      toast.error("Position is required");
      return;
    }

    setLoading(true);

    try {
      await updateEmployee(employeeId, {
        fullName: fullName.trim(),
        position: position.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        idNumber: idNumber.trim() || undefined,
        address: address.trim() || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        employeeNumber: employeeNumber.trim() || undefined,
        department: department.trim() || undefined,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        terminationDate: terminationDate ? new Date(terminationDate) : undefined,
        employmentType,
        isActive,
      });

      setOpen(false);
      refresh();
      toast.success("Employee details updated!");
    } catch {
      toast.error("Failed to update employee details");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName(employee.fullName);
    setPosition(employee.position);
    setEmail(employee.email || "");
    setPhone(employee.phone || "");
    setIdNumber(employee.idNumber || "");
    setAddress(employee.address || "");
    setDateOfBirth(formatDateForInput(employee.dateOfBirth));
    setEmployeeNumber(employee.employeeNumber || "");
    setDepartment(employee.department || "");
    setHireDate(formatDateForInput(employee.hireDate));
    setTerminationDate(formatDateForInput(employee.terminationDate));
    setEmploymentType(employee.employmentType || "PERMANENT");
    setIsActive(employee.isActive !== false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
          <DialogDescription>
            Update the employee&apos;s information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="8501015800083"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeNumber">Employee Number</Label>
                  <Input
                    id="employeeNumber"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    placeholder="EMP001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="082 123 4567"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position <span className="text-red-500">*</span></Label>
                  <Input
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Nurse, Doctor, Admin, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Clinical, Admin, etc."
                  />
                </div>
              </div>

              {/* Owner-only employment details */}
              {showEmploymentSection && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERMANENT">Permanent</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="LOCUM">Locum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={hireDate}
                        onChange={(e) => setHireDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="terminationDate">Termination Date</Label>
                      <Input
                        id="terminationDate"
                        type="date"
                        value={terminationDate}
                        onChange={(e) => setTerminationDate(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">Only fill if employee has left</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center gap-3 pt-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                        <span className={`text-sm ${isActive ? "text-green-600" : "text-slate-500"}`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isPending}>
              {(loading || isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
