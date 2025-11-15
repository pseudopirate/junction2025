import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFields = () => {
    setDateValue(localDefault);
    setDurationValue("60");
    setError(null);
    setShowSuccess(false);
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

      // --- Persist a 'general' daily record matching mock.data.ts schema ---
      // We'll use the date (midnight) as the numeric id so daily records are unique per date.
      try {
        // Normalize to YYYY-MM-DD (mock.data uses date-only strings)
        const dateOnly = new Date(isoDate).toISOString().split("T")[0];
        const dayTimestamp = new Date(dateOnly).setHours(0, 0, 0, 0);

        // Read all migraine records to compute counts / days since last attack
        // readAllData returns array of data objects
        const migrainesData = await storage.readAllData<{ date: string; durationMinutes: number }>("migraines");

        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const currentDayStart = new Date(dateOnly).getTime();

        // Count attacks in last 7 and 30 days (including current day)
        const attacks_last_7_days = migrainesData.reduce((cnt, m) => {
          const t = new Date(m.date).getTime();
          return t >= (currentDayStart - 7 * MS_PER_DAY) ? cnt + 1 : cnt;
        }, 0);

        const attacks_last_30_days = migrainesData.reduce((cnt, m) => {
          const t = new Date(m.date).getTime();
          return t >= (currentDayStart - 30 * MS_PER_DAY) ? cnt + 1 : cnt;
        }, 0);

        // Compute days_since_last_attack: find the most recent migraine strictly before currentDayStart
        const previousDates = migrainesData
          .map(m => new Date(m.date).getTime())
          .filter(ts => ts < currentDayStart)
          .sort((a, b) => b - a); // descending

        const days_since_last_attack = previousDates.length > 0
          ? Math.floor((currentDayStart - previousDates[0]) / MS_PER_DAY)
          : 0;

        // Aggregate sessions for the current date (including the one we just upserted)
        const sameDaySessions = migrainesData.filter(m => {
          const d = new Date(m.date).toISOString().split("T")[0];
          return d === dateOnly;
        });

        const migraine_sessions_count = sameDaySessions.length;
        const migraine_sessions_total_minutes = sameDaySessions.reduce((sum, s) => {
          const v = typeof s.durationMinutes === 'number' ? s.durationMinutes : 0;
          return sum + v;
        }, 0);
        const migraine_sessions_avg_minutes = migraine_sessions_count > 0
          ? migraine_sessions_total_minutes / migraine_sessions_count
          : 0;

        // Determine the last session (most recent time) for this day
        let last_migraine_time = null;
        let last_migraine_duration_minutes = 0;
        if (sameDaySessions.length > 0) {
          const last = sameDaySessions.reduce((prev, curr) => {
            return new Date(prev.date).getTime() > new Date(curr.date).getTime() ? prev : curr;
          });
          last_migraine_time = last.date;
          last_migraine_duration_minutes = last.durationMinutes || 0;
        }

        // Build a general record with the fields expected by mock.data.ts.
        // We include additional per-day migraine summary fields: count, total, avg, last duration/time
        const generalRecord = {
          date: dateOnly,
          sleep_hours: 7.0,
          stress_level: 2,
          screen_time_hours: 2.0,
          hydration_low: 0,
          skipped_meal: 0,
          bright_light_exposure: 0,
          pressure_drop: 0,
          prodrome_symptoms: 0,
          days_since_last_attack,
          attacks_last_7_days,
          attacks_last_30_days,
          migraine_next_day: 0,
          // Per-day migraine session aggregates
          migraine_sessions_count,
          migraine_sessions_total_minutes,
          migraine_sessions_avg_minutes,
          last_migraine_duration_minutes,
          last_migraine_time
        };

        // Upsert into 'general' store (safe to overwrite same-day record)
        await storage.upsert(dayTimestamp, generalRecord, "general");
      } catch (err) {
        // Non-fatal: log but don't block the UI success flow
        console.error("Failed to persist general daily record", err);
      }
      // --- end general record persistence ---

      // Show success animation/state, keep dialog open while animating
      setShowSuccess(true);
      setIsSaving(false);

      // Notify parent immediately so any lists can update optimistically
      if (onSaved) {
        onSaved(record);
      } else {
        // best-effort: log to console for visibility during development
        console.log("Migraine logged", record);
      }

      // After a short animation delay, close the dialog and reset fields
      window.setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
        resetFields();
      }, 900);
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
    <Dialog open={open} onOpenChange={(val) => { if (isSaving) return; setOpen(val); if (!val) resetFields(); }}>
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

        {showSuccess && (
          <div className="flex items-center justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl transform transition-all duration-300 scale-110">
              ✓
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={isSaving || showSuccess} onClick={() => { setOpen(false); resetFields(); }}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={isSaving || showSuccess}>
            {isSaving ? (
              <>
                <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Saving...
              </>
            ) : showSuccess ? (
              <>
                <span className="mr-2">✓</span>Saved
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MigraineLogDialog;
