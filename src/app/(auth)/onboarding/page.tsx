"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { Loader2, Building2, Users, UserPlus, ChevronRight, ChevronLeft, Check, X, Mail } from "lucide-react";
import { toast } from "sonner";
import { completeOnboarding } from "@/lib/actions/onboarding";

type TeamMember = {
  fullName: string;
  email: string;
  position: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Practice Details
  const [practiceName, setPracticeName] = useState("");
  const [practiceNumber, setPracticeNumber] = useState("");
  const [practicePhone, setPracticePhone] = useState("");
  const [practiceAddress, setPracticeAddress] = useState("");

  // Step 2: Practice Size
  const [practiceSize, setPracticeSize] = useState<string>("");

  // Step 3: Team Members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState<TeamMember>({ fullName: "", email: "", position: "" });
  const [showAddMember, setShowAddMember] = useState(false);

  const totalSteps = 3;

  const handleAddMember = () => {
    if (!newMember.fullName || !newMember.email || !newMember.position) {
      toast.error("Please fill in all fields");
      return;
    }

    // Basic email validation
    if (!newMember.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setTeamMembers([...teamMembers, newMember]);
    setNewMember({ fullName: "", email: "", position: "" });
    setShowAddMember(false);
    toast.success(`${newMember.fullName} added to team`);
  };

  const handleRemoveMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!practiceName) {
        toast.error("Please enter your practice name");
        return;
      }
    }
    if (step === 2) {
      if (!practiceSize) {
        toast.error("Please select your practice size");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      await completeOnboarding({
        practiceName,
        practiceNumber: practiceNumber || undefined,
        practicePhone: practicePhone || undefined,
        practiceAddress: practiceAddress || undefined,
        practiceSize,
        teamMembers,
      });

      toast.success("Welcome to VeriMedrix!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <VeyroLogo className="h-12" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to VeriMedrix</CardTitle>
          <CardDescription>
            Let&apos;s get your practice set up in just a few steps
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s < step
                      ? "bg-green-500 text-white"
                      : s === step
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < totalSteps && (
                  <div
                    className={`w-12 h-1 mx-1 rounded ${
                      s < step ? "bg-green-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step 1: Practice Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Practice Details</h3>
                  <p className="text-sm text-slate-500">Tell us about your practice</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="practiceName">Practice Name *</Label>
                  <Input
                    id="practiceName"
                    placeholder="e.g., Smith Family Practice"
                    value={practiceName}
                    onChange={(e) => setPracticeName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="practiceNumber">Practice Number (optional)</Label>
                  <Input
                    id="practiceNumber"
                    placeholder="e.g., PR123456"
                    value={practiceNumber}
                    onChange={(e) => setPracticeNumber(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="practicePhone">Phone (optional)</Label>
                    <Input
                      id="practicePhone"
                      placeholder="e.g., 011 123 4567"
                      value={practicePhone}
                      onChange={(e) => setPracticePhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practiceAddress">Address (optional)</Label>
                    <Input
                      id="practiceAddress"
                      placeholder="e.g., 123 Main St, Johannesburg"
                      value={practiceAddress}
                      onChange={(e) => setPracticeAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Practice Size */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Practice Size</h3>
                  <p className="text-sm text-slate-500">How many people work at your practice?</p>
                </div>
              </div>

              <RadioGroup value={practiceSize} onValueChange={setPracticeSize} className="space-y-3">
                <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${practiceSize === "solo" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <RadioGroupItem value="solo" id="solo" />
                  <div className="flex-1">
                    <p className="font-medium">Just me</p>
                    <p className="text-sm text-slate-500">Solo practitioner</p>
                  </div>
                </label>

                <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${practiceSize === "small" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <RadioGroupItem value="small" id="small" />
                  <div className="flex-1">
                    <p className="font-medium">2-5 staff members</p>
                    <p className="text-sm text-slate-500">Small practice</p>
                  </div>
                </label>

                <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${practiceSize === "medium" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <RadioGroupItem value="medium" id="medium" />
                  <div className="flex-1">
                    <p className="font-medium">6-15 staff members</p>
                    <p className="text-sm text-slate-500">Medium practice</p>
                  </div>
                </label>

                <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${practiceSize === "large" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <RadioGroupItem value="large" id="large" />
                  <div className="flex-1">
                    <p className="font-medium">15+ staff members</p>
                    <p className="text-sm text-slate-500">Large practice or group</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Team Members */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Add Team Members</h3>
                  <p className="text-sm text-slate-500">
                    Add staff who need access to VeriMedrix (optional)
                  </p>
                </div>
              </div>

              {/* Team Members List */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.fullName}</p>
                          <p className="text-xs text-slate-500">{member.position} • {member.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Member Form */}
              {showAddMember ? (
                <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                  <div className="space-y-2">
                    <Label htmlFor="memberName">Full Name *</Label>
                    <Input
                      id="memberName"
                      placeholder="e.g., Jane Smith"
                      value={newMember.fullName}
                      onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberEmail">Email *</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      placeholder="e.g., jane@example.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberPosition">Position *</Label>
                    <Input
                      id="memberPosition"
                      placeholder="e.g., Practice Nurse, Receptionist"
                      value={newMember.position}
                      onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleAddMember} className="flex-1">
                      Add to Team
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddMember(false);
                        setNewMember({ fullName: "", email: "", position: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddMember(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              )}

              {teamMembers.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <Mail className="h-4 w-4" />
                  <span>
                    {teamMembers.length} team member{teamMembers.length > 1 ? "s" : ""} will receive
                    an invitation email to join your practice.
                  </span>
                </div>
              )}

              {practiceSize === "solo" && teamMembers.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  You can always add team members later from the Team page.
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleComplete} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
