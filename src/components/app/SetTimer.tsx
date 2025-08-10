import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Counter from "@/components/visual/Counter";
import { toast } from "@/components/ui/sonner";

// Request notification permission on component mount
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Show notification with sound and vibration
const showNotification = () => {
  // Vibration
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
  
  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Rest Timer Complete! 💪', {
      body: 'Time to start your next set!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'rest-timer',
      requireInteraction: true,
      actions: [
        { action: 'start', title: 'Start Next Set' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  }
  
  // Audio notification
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => {
      // Fallback: create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    });
  } catch (error) {
    console.log('Audio notification failed:', error);
  }
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function SetTimer() {
  const [seconds, setSeconds] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const progress = useMemo(() => (seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 0), [seconds, remaining]);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setRunning(false);
          
          // Show comprehensive notification
          showNotification();
          toast.success("Rest complete! 💪", { 
            description: "Time to start your next set.",
            duration: 5000,
          });
          
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = () => {
    setRemaining(seconds);
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const resume = () => setRunning(true);
  const reset = () => {
    setRunning(false);
    setRemaining(seconds);
  };

  return (
    <Card className="card-elevated glass p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold">Rest Timer</h3>
        <div className="text-xs sm:text-sm text-muted-foreground">Between sets</div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs sm:text-sm">Seconds</label>
        <Input
          type="number"
          min={10}
          max={600}
          value={seconds}
          onChange={(e) => {
            const v = Number(e.target.value) || 0;
            setSeconds(v);
            setRemaining(v);
          }}
          className="w-16 sm:w-24 text-sm"
        />
      </div>
      <div className="rounded-md border p-4 sm:p-6 text-center">
        <div className="flex items-end justify-center gap-2">
          <Counter 
            value={mins} 
            fontSize={window.innerWidth < 640 ? 32 : 48} 
            places={[10,1]} 
            textColor="hsl(var(--primary))" 
          />
          <span className="text-2xl sm:text-4xl font-bold">:</span>
          <Counter 
            value={secs} 
            fontSize={window.innerWidth < 640 ? 32 : 48} 
            places={[10,1]} 
            textColor="hsl(var(--primary))" 
          />
        </div>
        <div className="mt-3 h-2 w-full rounded bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {!running && remaining === seconds && (
          <Button variant="hero" onClick={start} className="flex-1 text-sm sm:text-base">
            Start Timer
          </Button>
        )}
        {running && (
          <Button variant="secondary" onClick={pause} className="flex-1 text-sm sm:text-base">
            Pause
          </Button>
        )}
        {!running && remaining !== seconds && remaining > 0 && (
          <Button variant="default" onClick={resume} className="flex-1 text-sm sm:text-base">
            Resume
          </Button>
        )}
        <Button variant="outline" onClick={reset} className="flex-1 text-sm sm:text-base">
          Reset
        </Button>
      </div>
    </Card>
  );
}
