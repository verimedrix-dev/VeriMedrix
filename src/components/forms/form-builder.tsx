"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  Hash,
  CheckSquare,
  CircleDot,
  ChevronDown,
  Calendar,
  Clock,
  PenTool,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCustomForm, updateCustomForm, FormField, FormFieldType, FormSchedule } from "@/lib/actions/forms";
import { createId } from "@paralleldrive/cuid2";

const FIELD_TYPES: { type: FormFieldType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Short Text", icon: <Type className="h-4 w-4" /> },
  { type: "textarea", label: "Long Text", icon: <AlignLeft className="h-4 w-4" /> },
  { type: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "radio", label: "Multiple Choice", icon: <CircleDot className="h-4 w-4" /> },
  { type: "dropdown", label: "Dropdown", icon: <ChevronDown className="h-4 w-4" /> },
  { type: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
  { type: "time", label: "Time", icon: <Clock className="h-4 w-4" /> },
  { type: "signature", label: "Signature", icon: <PenTool className="h-4 w-4" /> },
];

interface FormBuilderProps {
  existingForm?: {
    id: string;
    name: string;
    description: string | null;
    fields: FormField[];
    schedule: FormSchedule;
    isActive: boolean;
  };
}

export function FormBuilder({ existingForm }: FormBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(existingForm?.name || "");
  const [description, setDescription] = useState(existingForm?.description || "");
  const [schedule, setSchedule] = useState<FormSchedule>(existingForm?.schedule || null);
  const [fields, setFields] = useState<FormField[]>(existingForm?.fields || []);
  const [isActive, setIsActive] = useState(existingForm?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: createId(),
      type,
      label: "",
      required: false,
      order: fields.length,
      options: type === "radio" || type === "dropdown" ? ["Option 1", "Option 2"] : undefined,
    };
    setEditingField(newField);
    setShowFieldDialog(true);
  };

  const saveField = () => {
    if (!editingField) return;
    if (!editingField.label.trim()) {
      toast.error("Field label is required");
      return;
    }

    const existingIndex = fields.findIndex(f => f.id === editingField.id);
    if (existingIndex >= 0) {
      const updated = [...fields];
      updated[existingIndex] = editingField;
      setFields(updated);
    } else {
      setFields([...fields, editingField]);
    }
    setShowFieldDialog(false);
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId).map((f, i) => ({ ...f, order: i })));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) return;

    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields.map((f, i) => ({ ...f, order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Form name is required");
      return;
    }
    if (fields.length === 0) {
      toast.error("Add at least one field");
      return;
    }

    setSaving(true);
    try {
      if (existingForm) {
        const result = await updateCustomForm(existingForm.id, {
          name,
          description: description || undefined,
          fields,
          schedule,
          isActive,
        });
        if (result.success) {
          toast.success("Form updated successfully");
          router.push("/forms");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update form");
        }
      } else {
        const result = await createCustomForm({
          name,
          description: description || undefined,
          fields,
          schedule,
        });
        if (result.success) {
          toast.success("Form created successfully");
          router.push("/forms");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to create form");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const getFieldIcon = (type: FormFieldType) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    return fieldType?.icon || <Type className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Bathroom Cleaning Checklist"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule (Optional)</Label>
              <Select
                value={schedule || "none"}
                onValueChange={(v) => setSchedule(v === "none" ? null : v as FormSchedule)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No schedule (on-demand)</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly (Mondays)</SelectItem>
                  <SelectItem value="MONTHLY">Monthly (1st of month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this form..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          {existingForm && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="isActive">Form is active</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fields Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Fields</CardTitle>
            <p className="text-sm text-slate-500">{fields.length} field{fields.length !== 1 ? "s" : ""}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Field Type Buttons */}
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            {FIELD_TYPES.map((fieldType) => (
              <Button
                key={fieldType.type}
                variant="outline"
                size="sm"
                onClick={() => addField(fieldType.type)}
              >
                {fieldType.icon}
                <span className="ml-2">{fieldType.label}</span>
              </Button>
            ))}
          </div>

          {/* Fields List */}
          {fields.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Plus className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>Click a field type above to add fields to your form</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <GripVertical className="h-5 w-5 text-slate-400 cursor-move" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFieldIcon(field.type)}
                    <span className="font-medium truncate">{field.label || "Untitled"}</span>
                    {field.required && (
                      <span className="text-red-500 text-sm">*</span>
                    )}
                    <span className="text-xs text-slate-400">({field.type})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveField(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveField(index, "down")}
                      disabled={index === fields.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingField(field);
                        setShowFieldDialog(true);
                      }}
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => deleteField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {existingForm ? "Save Changes" : "Create Form"}
        </Button>
      </div>

      {/* Field Edit Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {fields.find(f => f.id === editingField?.id) ? "Edit Field" : "Add Field"}
            </DialogTitle>
            <DialogDescription>
              Configure the field properties
            </DialogDescription>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Field Label *</Label>
                <Input
                  placeholder="e.g., Toilets cleaned"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                />
              </div>

              {editingField.type === "text" && (
                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    placeholder="Placeholder text..."
                    value={editingField.placeholder || ""}
                    onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                  />
                </div>
              )}

              {editingField.type === "number" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Value</Label>
                    <Input
                      type="number"
                      value={editingField.min ?? ""}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        min: e.target.value ? Number(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Value</Label>
                    <Input
                      type="number"
                      value={editingField.max ?? ""}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        max: e.target.value ? Number(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              )}

              {(editingField.type === "radio" || editingField.type === "dropdown") && (
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={(editingField.options || []).join("\n")}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      options: e.target.value.split("\n").filter(o => o.trim())
                    })}
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Help Text</Label>
                <Input
                  placeholder="Additional instructions..."
                  value={editingField.helpText || ""}
                  onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={editingField.required}
                  onCheckedChange={(checked) => setEditingField({
                    ...editingField,
                    required: checked === true
                  })}
                />
                <Label htmlFor="required">Required field</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveField}>
              Save Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
