"use client";

import { useState } from "react";
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

  // Step 1: Practice Details
  const [practiceName, setPracticeName] = useState("");
  const [practiceNumber, setPracticeNumber] = useState("");
  const [practicePhone, setPracticePhone] = useState("");
  const [practiceAddress, setPracticeAddress] = useState("");
  const [province, setProvince] = useState("");

  // Step 2: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<"ESSENTIALS" | "PROFESSIONAL" | "">("");

  const totalSteps = 2;

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

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2].map((s) => (
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
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Choose Your Plan</h3>
                  <p className="text-sm text-slate-500">Both plans include a 14-day free trial</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Essentials Plan */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("ESSENTIALS")}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === "ESSENTIALS"
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">Essentials</h4>
                      <p className="text-sm text-slate-500">Perfect for small practices</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">R1,999</div>
                      <div className="text-sm text-slate-500">/month</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Up to 3 users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Document management & expiry tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Task management & daily logbook</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Complaints & adverse events register</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Inspection readiness dashboard</span>
                    </div>
                  </div>
                  {selectedPlan === "ESSENTIALS" && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <span className="text-sm font-medium text-blue-600">Selected</span>
                    </div>
                  )}
                </button>

                {/* Professional Plan */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("PROFESSIONAL")}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all relative ${
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
                  <div className="flex justify-between items-start mb-3 pt-1">
                    <div>
                      <h4 className="font-semibold text-lg">Professional</h4>
                      <p className="text-sm text-slate-500">For growing practices</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">R3,999</div>
                      <div className="text-sm text-slate-500">/month</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Unlimited users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Everything in Essentials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Leave management & payroll</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Locum management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>SARS reporting (IRP5, EMP201)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>AI Compliance Assistant</span>
                    </div>
                  </div>
                  {selectedPlan === "PROFESSIONAL" && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <span className="text-sm font-medium text-indigo-600">Selected</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 text-center">
                  <strong>14-day free trial</strong> on both plans. No credit card required. Cancel anytime.
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
