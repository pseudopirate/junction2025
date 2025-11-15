import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { storage } from "../internal/storage";

interface MigraineRecord {
  date: string; // ISO string
  durationMinutes: number;
  // future fields (e.g. severity, notes) can be added here
}

interface MigraineLogDialogProps {
  /**
   * Optional children to be used as the Dialog trigger. If provided, it will be rendered inside DialogTrigger asChild.
   */
  children?: ReactNode;
  /**
   * Optional callback when a migraine record has been saved.
   */
  onSaved?: (record: MigraineRecord) => void;
  /**
   * Optional custom trigger label (defaults to "Log Migraine")
   */
  triggerLabel?: string;
}

/**
 * MigraineLogDialog
 *
 * Renders a Dialog with a trigger button. Allows the user to enter:
 *  - date/time of the attack
 *  - duration (minutes)
 *
 * On submit it stores a record into the 'migraines' store using the app's storage API.
 */
export function MigraineLogDialog({
  children,
  onSaved,
  triggerLabel = "Log Migraine",
}: MigraineLogDialogProps) {
  const [open, setOpen] = useState(false);
  // datetime-local expects value like "YYYY-MM-DDTHH:mm"
  const nowLocal = new Date();
  const localDefault = (() => {
    // build YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, "0");
    const YYYY = nowLocal.getFullYear();
    const MM = pad(nowLocal.getMonth() + 1);
    const DD = pad(nowLocal.getDate());
    const hh = pad(nowLocal.getHours());
    const mm = pad(nowLocal.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  })();

  const [dateValue, setDateValue] = useState<string>(localDefault);
  const [durationValue, setDurationValue] = useState<string>("60");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setDateValue(localDefault);
    setDurationValue("60");
    setError(null);
  };

  async function handleSubmit() {
    setError(null);
    const parsedDuration = Number(durationValue);
    if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      setError("Please enter a valid duration in minutes.");
      return;
    }

    // Convert the datetime-local value to an ISO string
    // If user provided only a date (unlikely with datetime-local), fallback to now
    const isoDate = dateValue ? new Date(dateValue).toISOString() : new Date().toISOString();

    const record: MigraineRecord = {
      date: isoDate,
      durationMinutes: Math.round(parsedDuration),
    };

    setIsSaving(true);

    try {
      // Use a timestamp id to ensure uniqueness
      const id = Date.now();
      // Create the store entry in 'migraines'
      // We use upsert to be safe (create or update)
      await storage.upsert(id, record, "migraines");

      setIsSaving(false);
      setOpen(false);
      resetFields();

      if (onSaved) {
        onSaved(record);
      } else {
        // best-effort: log to console for visibility during development
        console.log("Migraine logged", record);
      }
    } catch (e: unknown) {
      console.error("Failed to save migraine record", e);
      setIsSaving(false);
      if (e instanceof Error) {
        setError(e.message || "Failed to save record");
      } else {
        setError(String(e) || "Failed to save record");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetFields(); }}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant="outline" className="w-full justify-start h-auto p-4 active:scale-98 transition-transform">
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Migraine Attack</DialogTitle>
          <DialogDescription>
            Record the date/time and how long the attack lasted.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <Label>Date &amp; Time</Label>
            <Input
              type="datetime-local"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              aria-label="Date and time of migraine"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min={1}
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
              aria-label="Duration in minutes"
              className="mt-1"
            />
          </div>

          {error && <div className="text-destructive text-sm">{error}</div>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => { setOpen(false); resetFields(); }}>
              Cancel
            </Button>
          </DialogClose>

          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MigraineLogDialog;