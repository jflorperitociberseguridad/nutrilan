export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  preferences: {
    dietaryRestrictions: string[];
    caloriesGoal: number;
  };
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutritionalValue: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  authorId: string;
  isPublic: boolean;
  createdAt: string;
}

export interface DailyMeals {
  breakfast?: string; // Recipe ID
  lunch?: string; // Recipe ID
  dinner?: string; // Recipe ID
  snacks: string[]; // Recipe IDs
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDate: string; // YYYY-MM-DD
  days: {
    monday: DailyMeals;
    tuesday: DailyMeals;
    wednesday: DailyMeals;
    thursday: DailyMeals;
    friday: DailyMeals;
    saturday: DailyMeals;
    sunday: DailyMeals;
  };
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
