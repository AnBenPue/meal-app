import { useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { UserSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: UserSettings['theme']; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  const { settings, loaded, loadSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    if (!loaded) loadSettings();
  }, [loaded, loadSettings]);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={settings.theme === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ theme: value })}
                className={cn('flex-1', settings.theme === value && 'pointer-events-none')}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Goals</CardTitle>
          <CardDescription>Set your daily calorie and macro targets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="calories">Daily Calories</Label>
            <Input
              id="calories"
              type="number"
              min={0}
              value={settings.dailyCalorieGoal}
              onChange={(e) => updateSettings({ dailyCalorieGoal: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              min={0}
              value={settings.macroGoals.protein}
              onChange={(e) =>
                updateSettings({
                  macroGoals: { ...settings.macroGoals, protein: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              min={0}
              value={settings.macroGoals.carbs}
              onChange={(e) =>
                updateSettings({
                  macroGoals: { ...settings.macroGoals, carbs: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="fat">Fat (g)</Label>
            <Input
              id="fat"
              type="number"
              min={0}
              value={settings.macroGoals.fat}
              onChange={(e) =>
                updateSettings({
                  macroGoals: { ...settings.macroGoals, fat: Number(e.target.value) },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* USDA API */}
      <Card>
        <CardHeader>
          <CardTitle>USDA Food Database</CardTitle>
          <CardDescription>
            Enter your free API key to search the USDA food database when logging meals.
            Get one at fdc.nal.usda.gov/api-key-signup.html
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="usda-key">API Key</Label>
            <Input
              id="usda-key"
              type="password"
              placeholder="Enter your USDA API key"
              value={settings.usdaApiKey}
              onChange={(e) => updateSettings({ usdaApiKey: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
