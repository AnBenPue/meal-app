import { Link } from 'react-router-dom';
import { Plus, CalendarDays, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link to="/log">
          <Plus className="h-4 w-4 mr-2" />
          Log Food
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/planner">
          <CalendarDays className="h-4 w-4 mr-2" />
          Meal Planner
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/recipes">
          <UtensilsCrossed className="h-4 w-4 mr-2" />
          Recipes
        </Link>
      </Button>
    </div>
  );
}
