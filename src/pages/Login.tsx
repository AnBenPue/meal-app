import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">MealApp</CardTitle>
          <CardDescription>
            Sign in to sync your recipes, meal plans, and food logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={signInWithGoogle} className="w-full">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
