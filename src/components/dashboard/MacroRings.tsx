import type { NutritionInfo } from '@/types';
import { goalProgress } from '@/lib/nutrition';

interface MacroRingsProps {
  current: NutritionInfo;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface RingProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  trackColor: string;
}

function Ring({ label, current, goal, unit, color, trackColor }: RingProps) {
  const pct = Math.min(goalProgress(current, goal), 100);
  const radius = 40;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-tight">
            {Math.round(current)}
          </span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground">
        {pct}% of {goal}{unit}
      </div>
    </div>
  );
}

export function MacroRings({ current, goals }: MacroRingsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
      <Ring
        label="Calories"
        current={current.calories}
        goal={goals.calories}
        unit=""
        color="hsl(142.1 76.2% 36.3%)"
        trackColor="hsl(142.1 76.2% 36.3% / 0.15)"
      />
      <Ring
        label="Protein"
        current={current.protein}
        goal={goals.protein}
        unit="g"
        color="hsl(221.2 83.2% 53.3%)"
        trackColor="hsl(221.2 83.2% 53.3% / 0.15)"
      />
      <Ring
        label="Carbs"
        current={current.carbs}
        goal={goals.carbs}
        unit="g"
        color="hsl(32.1 94.6% 43.7%)"
        trackColor="hsl(32.1 94.6% 43.7% / 0.15)"
      />
      <Ring
        label="Fat"
        current={current.fat}
        goal={goals.fat}
        unit="g"
        color="hsl(280 67% 50%)"
        trackColor="hsl(280 67% 50% / 0.15)"
      />
    </div>
  );
}
