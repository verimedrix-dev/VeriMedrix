"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { submitFormResponse, FormField } from "@/lib/actions/forms";

interface FormFillerProps {
  form: {
    id: string;
    name: string;
    description: string | null;
    fields: FormField[];
  };
}

export function FormFiller({ form }: FormFillerProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string | number | boolean | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateResponse = (fieldId: string, value: string | number | boolean | string[]) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of form.fields) {
      if (field.required) {
        const value = responses[field.id];
        if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          toast.error(`"${field.label}" is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const result = await submitFormResponse(form.id, responses);
      if (result.success) {
        setSubmitted(true);
        toast.success("Form submitted successfully");
      } else {
        toast.error(result.error || "Failed to submit form");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Form Submitted!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Your response has been recorded.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/forms")}>
                Back to Forms
              </Button>
              <Button onClick={() => {
                setSubmitted(false);
                setResponses({});
              }}>
                Submit Another
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          {form.description && (
            <CardDescription>{form.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>

              {field.type === "text" && (
                <Input
                  placeholder={field.placeholder}
                  value={(responses[field.id] as string) || ""}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                />
              )}

              {field.type === "textarea" && (
                <Textarea
                  placeholder={field.placeholder}
                  value={(responses[field.id] as string) || ""}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  rows={3}
                />
              )}

              {field.type === "number" && (
                <Input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={(responses[field.id] as number) || ""}
                  onChange={(e) => updateResponse(field.id, e.target.value ? Number(e.target.value) : "")}
                />
              )}

              {field.type === "checkbox" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={(responses[field.id] as boolean) || false}
                    onCheckedChange={(checked) => updateResponse(field.id, checked === true)}
                  />
                  <Label htmlFor={field.id} className="text-sm font-normal">
                    Yes
                  </Label>
                </div>
              )}

              {field.type === "radio" && field.options && (
                <RadioGroup
                  value={(responses[field.id] as string) || ""}
                  onValueChange={(value) => updateResponse(field.id, value)}
                >
                  {field.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${field.id}-${i}`} />
                      <Label htmlFor={`${field.id}-${i}`} className="font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {field.type === "dropdown" && field.options && (
                <Select
                  value={(responses[field.id] as string) || ""}
                  onValueChange={(value) => updateResponse(field.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option, i) => (
                      <SelectItem key={i} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === "date" && (
                <Input
                  type="date"
                  value={(responses[field.id] as string) || ""}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                />
              )}

              {field.type === "time" && (
                <Input
                  type="time"
                  value={(responses[field.id] as string) || ""}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                />
              )}

              {field.type === "datetime" && (
                <Input
                  type="datetime-local"
                  value={(responses[field.id] as string) || ""}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                />
              )}

              {field.type === "signature" && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-400">
                  <p className="text-sm">Signature capture coming soon</p>
                  <Input
                    placeholder="Type your name as signature"
                    value={(responses[field.id] as string) || ""}
                    onChange={(e) => updateResponse(field.id, e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              {field.helpText && (
                <p className="text-xs text-slate-500">{field.helpText}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
