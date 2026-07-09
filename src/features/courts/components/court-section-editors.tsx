"use client";

import { Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateCourtInput } from "@/lib/validators/court.schema";
import { DAY_LABELS } from "@/lib/validators/venue.schema";
import { SURFACE_TYPE_OPTIONS } from "@/features/courts/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface CourtEquipmentEditorProps {
  form: UseFormReturn<CreateCourtInput>;
  disabled?: boolean;
}

export function CourtEquipmentEditor({ form, disabled }: CourtEquipmentEditorProps) {
  const equipment = form.watch("equipment");

  function addItem() {
    form.setValue(
      "equipment",
      [...equipment, { name: "", quantity: 1, included: true }],
      { shouldDirty: true }
    );
  }

  function removeItem(index: number) {
    form.setValue(
      "equipment",
      equipment.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  }

  return (
    <div className="space-y-3">
      {equipment.length === 0 && (
        <p className="text-sm text-muted-foreground">No equipment listed.</p>
      )}
      {equipment.map((_, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_100px_auto_auto]"
        >
          <FormField
            control={form.control}
            name={`equipment.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Name</FormLabel>
                <FormControl>
                  <Input placeholder="Equipment name" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`equipment.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Qty</FormLabel>
                <FormControl>
                  <Input type="number" min={0} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`equipment.${index}.included`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormLabel className="font-normal">Included</FormLabel>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => removeItem(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addItem}>
        <Plus className="h-4 w-4" />
        Add equipment
      </Button>
    </div>
  );
}

interface CourtHoursEditorProps {
  form: UseFormReturn<CreateCourtInput>;
  disabled?: boolean;
}

export function CourtHoursEditor({ form, disabled }: CourtHoursEditorProps) {
  const hours = form.watch("operatingHours");

  return (
    <div className="space-y-3">
      {hours.map((hour, index) => (
        <div
          key={hour.dayOfWeek}
          className="grid gap-3 rounded-md border p-3 sm:grid-cols-[120px_1fr_1fr_auto]"
        >
          <div className="flex items-center text-sm font-medium">
            {DAY_LABELS[hour.dayOfWeek]}
          </div>
          <FormField
            control={form.control}
            name={`operatingHours.${index}.openTime`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="time" disabled={disabled || hour.isClosed} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`operatingHours.${index}.closeTime`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="time" disabled={disabled || hour.isClosed} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`operatingHours.${index}.isClosed`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormLabel className="font-normal">Closed</FormLabel>
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}

interface CourtBlackoutsEditorProps {
  form: UseFormReturn<CreateCourtInput>;
  disabled?: boolean;
}

export function CourtBlackoutsEditor({ form, disabled }: CourtBlackoutsEditorProps) {
  const blackouts = form.watch("blackouts");

  function addBlackout() {
    const now = new Date();
    const later = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    form.setValue(
      "blackouts",
      [
        ...blackouts,
        { startTime: now.toISOString(), endTime: later.toISOString(), reason: "" },
      ],
      { shouldDirty: true }
    );
  }

  function removeBlackout(index: number) {
    form.setValue(
      "blackouts",
      blackouts.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  }

  function toLocalInput(iso: string): string {
    const date = new Date(iso);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  function fromLocalInput(value: string): string {
    return new Date(value).toISOString();
  }

  return (
    <div className="space-y-3">
      {blackouts.length === 0 && (
        <p className="text-sm text-muted-foreground">No blackout periods.</p>
      )}
      {blackouts.map((_, index) => (
        <div key={index} className="grid gap-3 rounded-md border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name={`blackouts.${index}.startTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={disabled}
                      value={toLocalInput(field.value)}
                      onChange={(e) => field.onChange(fromLocalInput(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`blackouts.${index}.endTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={disabled}
                      value={toLocalInput(field.value)}
                      onChange={(e) => field.onChange(fromLocalInput(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name={`blackouts.${index}.reason`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Maintenance, event..." disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-8"
              disabled={disabled}
              onClick={() => removeBlackout(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addBlackout}>
        <Plus className="h-4 w-4" />
        Add blackout
      </Button>
    </div>
  );
}

interface CourtPricingEditorProps {
  form: UseFormReturn<CreateCourtInput>;
  disabled?: boolean;
}

export function CourtPricingEditor({ form, disabled }: CourtPricingEditorProps) {
  const rules = form.watch("pricingRules");

  function addRule() {
    form.setValue(
      "pricingRules",
      [
        ...rules,
        {
          name: "Standard",
          dayOfWeek: [],
          startTime: "06:00",
          endTime: "22:00",
          pricePerSlot: 500,
          slotDurationMinutes: 60,
          priority: rules.length,
          isActive: true,
        },
      ],
      { shouldDirty: true }
    );
  }

  function removeRule(index: number) {
    form.setValue(
      "pricingRules",
      rules.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  }

  return (
    <div className="space-y-3">
      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground">No pricing rules.</p>
      )}
      {rules.map((_, index) => (
        <div key={index} className="space-y-3 rounded-md border p-3">
          <FormField
            control={form.control}
            name={`pricingRules.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-3 sm:grid-cols-4">
            <FormField
              control={form.control}
              name={`pricingRules.${index}.startTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input type="time" disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`pricingRules.${index}.endTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input type="time" disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`pricingRules.${index}.pricePerSlot`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`pricingRules.${index}.slotDurationMinutes`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slot (min)</FormLabel>
                  <FormControl>
                    <Input type="number" min={15} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name={`pricingRules.${index}.isActive`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => removeRule(index)}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addRule}>
        <Plus className="h-4 w-4" />
        Add pricing rule
      </Button>
    </div>
  );
}

export function CourtSurfaceFields({
  form,
  disabled,
}: {
  form: UseFormReturn<CreateCourtInput>;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <FormField
        control={form.control}
        name="surfaceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Surface</FormLabel>
            <FormControl>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={disabled}
                value={field.value ?? ""}
                onChange={field.onChange}
              >
                <option value="">Select surface</option>
                {SURFACE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="lengthM"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Length (m)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                min={0}
                disabled={disabled}
                value={field.value === "" ? "" : field.value}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="widthM"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Width (m)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                min={0}
                disabled={disabled}
                value={field.value === "" ? "" : field.value}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
