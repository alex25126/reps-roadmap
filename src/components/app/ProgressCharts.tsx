import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkoutStore, MuscleGroup } from "@/store/workoutStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ProgressCharts() {
  const { addProgressLog, progressByGroup } = useWorkoutStore();
  const [group, setGroup] = useState<MuscleGroup>("Chest");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [reps, setReps] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addProgressLog({ date, muscleGroup: group, weight, reps, notes });
    setNotes("");
  };

  const data = useMemo(() => progressByGroup(group).map((d) => ({
    date: new Date(d.date).toLocaleDateString(),
    weight: d.weight ?? 0,
  })), [group, progressByGroup]);

  return (
    <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-6 px-4">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold">Progress Tracking</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Log your lifts and see trends for each muscle group.</p>
      </header>

      <Card className="card-elevated glass p-4 sm:p-5">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Muscle Group</Label>
            <Select value={group} onValueChange={(v) => setGroup(v as MuscleGroup)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Chest","Back","Legs","Shoulders","Arms","Core","Glutes","Full Body"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input type="number" value={weight ?? ""} onChange={(e) => setWeight(e.target.value === "" ? undefined : Number(e.target.value))} />
          </div>
          <div>
            <Label>Reps</Label>
            <Input type="number" value={reps ?? ""} onChange={(e) => setReps(e.target.value === "" ? undefined : Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel? Any PRs?" />
          </div>
          <div className="sm:col-span-2 lg:col-span-6">
            <Button type="submit" variant="hero" className="w-full sm:w-auto">Add Log</Button>
          </div>
        </form>
      </Card>

      <Card className="card-elevated glass p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">Trend • {group}</h3>
        </div>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">No entries yet. Log your first set above.</p>
        )}
      </Card>
    </section>
  );
}
