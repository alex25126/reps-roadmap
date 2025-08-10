import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/sonner";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Glutes"
  | "Full Body";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: number;
  weight?: number;
}

export interface DayPlan {
  day: string; // e.g., "Monday"
  exercises: Exercise[];
}

export type WeeklyPlan = DayPlan[];

export interface ProgressLog {
  id: string;
  date: string; // ISO date
  muscleGroup: MuscleGroup;
  weight?: number;
  reps?: number;
  notes?: string;
}

const PLAN_KEY = "gp_weekly_plan_v1";
const LOGS_KEY = "gp_progress_logs_v1";

// Get current user session
const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || 'anonymous';
};

// Sync data with Supabase
const syncWithDatabase = async (exercises: Exercise[], logs: ProgressLog[]) => {
  try {
    const userId = await getCurrentUser();
    
    // Sync exercises
    for (const exercise of exercises) {
      const { error } = await supabase
        .from('exercises')
        .upsert({
          id: exercise.id,
          name: exercise.name,
          muscle_group: exercise.muscleGroup,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          day: '', // Will be set when we know which day
          user_id: userId
        });
      
      if (error) console.error('Error syncing exercise:', error);
    }
    
    // Sync progress logs
    for (const log of logs) {
      const { error } = await supabase
        .from('progress_logs')
        .upsert({
          id: log.id,
          date: log.date,
          muscle_group: log.muscleGroup,
          weight: log.weight,
          reps: log.reps,
          notes: log.notes,
          user_id: userId
        });
      
      if (error) console.error('Error syncing progress log:', error);
    }
  } catch (error) {
    console.error('Database sync error:', error);
  }
};

// Load data from Supabase
const loadFromDatabase = async (): Promise<{ exercises: Exercise[], logs: ProgressLog[] }> => {
  try {
    const userId = await getCurrentUser();
    
    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);
    
    const { data: logsData } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    const exercises = exercisesData?.map(e => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscle_group as MuscleGroup,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight
    })) || [];
    
    const logs = logsData?.map(l => ({
      id: l.id,
      date: l.date,
      muscleGroup: l.muscle_group as MuscleGroup,
      weight: l.weight,
      reps: l.reps,
      notes: l.notes
    })) || [];
    
    return { exercises, logs };
  } catch (error) {
    console.error('Error loading from database:', error);
    return { exercises: [], logs: [] };
  }
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export const DAYS_LIST = [...DAYS];

export function useWorkoutStore() {
  const [plan, setPlan] = useState<WeeklyPlan>(() => {
    const initial = safeGet<WeeklyPlan>(PLAN_KEY, DAYS_LIST.map((d) => ({ day: d, exercises: [] })));
    return initial;
  });

  const [logs, setLogs] = useState<ProgressLog[]>(() => safeGet<ProgressLog[]>(LOGS_KEY, []));
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { exercises, logs: dbLogs } = await loadFromDatabase();
        
        // Merge with local data
        const localPlan = safeGet<WeeklyPlan>(PLAN_KEY, DAYS_LIST.map((d) => ({ day: d, exercises: [] })));
        const localLogs = safeGet<ProgressLog[]>(LOGS_KEY, []);
        
        // Use database data if available, otherwise use local
        if (dbLogs.length > 0) {
          setLogs(dbLogs);
        } else if (localLogs.length > 0) {
          setLogs(localLogs);
        }
        
        setLastSync(new Date());
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to sync with database');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => safeSet(PLAN_KEY, plan), [plan]);
  useEffect(() => safeSet(LOGS_KEY, logs), [logs]);

  // Sync with database periodically
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const allExercises = plan.flatMap(p => p.exercises);
      await syncWithDatabase(allExercises, logs);
      setLastSync(new Date());
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [plan, logs]);

  const addExercise = (day: string, exercise: Omit<Exercise, "id">) => {
    const id = crypto.randomUUID();
    setPlan((prev) =>
      prev.map((dp) =>
        dp.day === day ? { ...dp, exercises: [...dp.exercises, { ...exercise, id }] } : dp
      )
    );
  };

  const removeExercise = (day: string, id: string) => {
    setPlan((prev) => prev.map((dp) => (dp.day === day ? { ...dp, exercises: dp.exercises.filter((e) => e.id !== id) } : dp)));
  };

  const addProgressLog = (log: Omit<ProgressLog, "id">) => {
    const id = crypto.randomUUID();
    const newLog = { ...log, id };
    setLogs((prev) => [newLog, ...prev]);
    
    // Immediately sync this log to database
    syncWithDatabase([], [newLog]);
    toast.success('Progress logged successfully!');
  };

  // Auto-update current day at midnight
  const [dayTick, setDayTick] = useState(0);
  useEffect(() => {
    const schedule = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
      const ms = next.getTime() - now.getTime();
      const timeout = window.setTimeout(() => {
        setDayTick((t) => t + 1);
        toast.success('New day started! 🌅');
        schedule();
      }, ms);
      return timeout;
    };
    const tid = schedule();
    return () => clearTimeout(tid);
  }, []);

  const todayName = useMemo(() => {
    const idx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    return DAYS_LIST[idx];
  }, [dayTick]);

  const todaysPlan = useMemo(
    () => plan.find((p) => p.day === todayName) ?? { day: todayName, exercises: [] },
    [plan, todayName]
  );


  const lastTrainedByGroup = useMemo(() => {
    const map = new Map<MuscleGroup, string>();
    for (const log of logs) {
      const existing = map.get(log.muscleGroup);
      if (!existing || new Date(log.date) > new Date(existing)) {
        map.set(log.muscleGroup, log.date);
      }
    }
    return map;
  }, [logs]);

  const inactiveMuscleGroups = (days: number): MuscleGroup[] => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const groups: MuscleGroup[] = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Glutes", "Full Body"];
    return groups.filter((g) => {
      const last = lastTrainedByGroup.get(g);
      return !last || new Date(last).getTime() < cutoff;
    });
  };

  const progressByGroup = (group: MuscleGroup) => logs.filter((l) => l.muscleGroup === group).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    plan,
    setPlan,
    logs,
    isLoading,
    lastSync,
    addExercise,
    removeExercise,
    addProgressLog,
    todaysPlan,
    todayName,
    lastTrainedByGroup,
    inactiveMuscleGroups,
    progressByGroup,
    DAYS_LIST,
  } as const;
}
