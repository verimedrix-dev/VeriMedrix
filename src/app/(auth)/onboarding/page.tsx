"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VeyroLogo } from "@/components/ui/veyro-logo";
import { Loader2, Building2, CreditCard, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { completeOnboarding } from "@/lib/actions/onboarding";

const SA_PROVINCES = [
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "gauteng", label: "Gauteng" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "north_west", label: "North West" },
  { value: "western_cape", label: "Western Cape" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [planFromSignup, setPlanFromSignup] = useState<"ESSENTIALS" | "HR_MANAGEMENT" | "PROFESSIONAL" | null>(null);

  // Step 1: Practice Details
  const [practiceName, setPracticeName] = useState("");
  const [practiceNumber, setPracticeNumber] = useState("");
  const [practicePhone, setPracticePhone] = useState("");
  const [practiceAddress, setPracticeAddress] = useState("");
  const [province, setProvince] = useState("");

  // Step 2: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<"ESSENTIALS" | "HR_MANAGEMENT" | "PROFESSIONAL" | "">("");

  // Check if plan was selected during sign-up
  useEffect(() => {
    const storedPlan = localStorage.getItem("selectedPlan");
    if (storedPlan === "ESSENTIALS" || storedPlan === "HR_MANAGEMENT" || storedPlan === "PROFESSIONAL") {
      setPlanFromSignup(storedPlan);
      setSelectedPlan(storedPlan);
      // Clear it so it doesn't persist for future sign-ups
      localStorage.removeItem("selectedPlan");
    }
  }, []);

  // If plan was pre-selected, only show 1 step
  const totalSteps = planFromSignup ? 1 : 2;

  const handleNext = () => {
    if (step === 1) {
      if (!practiceName) {
        toast.error("Please enter your practice name");
        return;
      }
      if (!province) {
        toast.error("Please select your province");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan to continue");
      return;
    }

    setLoading(true);

    try {
      await completeOnboarding({
        practiceName,
        practiceNumber: practiceNumber || undefined,
        practicePhone: practicePhone || undefined,
        practiceAddress: practiceAddress || undefined,
        province,
        subscriptionTier: selectedPlan,
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

          {/* Progress indicator - only show if more than 1 step */}
          {totalSteps > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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
          )}
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

                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger id="province">
                      <SelectValue placeholder="Select your province" />
                    </SelectTrigger>
                    <SelectContent>
                      {SA_PROVINCES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Show selected plan when pre-selected from sign-up */}
              {planFromSignup && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>Selected Plan:</strong> {planFromSignup === "PROFESSIONAL" ? "OHSC Professional" : planFromSignup === "HR_MANAGEMENT" ? "Practice Essentials" : "OHSC Essential"} - 14-day free trial
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Plan Selection - only show if plan wasn't pre-selected */}
          {step === 2 && !planFromSignup && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Choose Your Plan</h3>
                  <p className="text-sm text-slate-500">All plans include a 14-day free trial</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Practice Essentials Plan */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("HR_MANAGEMENT")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === "HR_MANAGEMENT"
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">Practice Essentials</h4>
                      <p className="text-sm text-slate-500">HR & Payroll focused</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">R999</div>
                      <div className="text-sm text-slate-500">/month</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Unlimited users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Task management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Leave management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Payroll</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Locum management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>SARS reporting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Financial metrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Inventory management</span>
                    </div>
                  </div>
                  {selectedPlan === "HR_MANAGEMENT" && (
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <span className="text-sm font-medium text-purple-600">Selected</span>
                    </div>
                  )}
                </button>

                {/* OHSC Essential Plan */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("ESSENTIALS")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === "ESSENTIALS"
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">OHSC Essential</h4>
                      <p className="text-sm text-slate-500">OHSC compliance focused</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">R1,999</div>
                      <div className="text-sm text-slate-500">/month</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Unlimited users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Document management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Task management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Complaints register</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Adverse events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Inspection readiness</span>
                    </div>
                  </div>
                  {selectedPlan === "ESSENTIALS" && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <span className="text-sm font-medium text-blue-600">Selected</span>
                    </div>
                  )}
                </button>

                {/* OHSC Professional Plan */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("PROFESSIONAL")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                    selectedPlan === "PROFESSIONAL"
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="absolute -top-3 left-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                  <div className="flex justify-between items-start mb-2 pt-1">
                    <div>
                      <h4 className="font-semibold text-lg">OHSC Professional</h4>
                      <p className="text-sm text-slate-500">Complete solution</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">R4,999</div>
                      <div className="text-sm text-slate-500">/month</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Unlimited users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Everything in both plans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Templates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                  </div>
                  {selectedPlan === "PROFESSIONAL" && (
                    <div className="mt-2 pt-2 border-t border-indigo-200">
                      <span className="text-sm font-medium text-indigo-600">Selected</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 text-center">
                  <strong>14-day free trial</strong> on all plans. No credit card required. Cancel anytime.
                </p>
              </div>
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
              <Button
                type="button"
                onClick={handleComplete}
                disabled={loading || !selectedPlan}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Start Free Trial
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
