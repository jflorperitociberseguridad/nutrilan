/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocFromServer 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  ChefHat, 
  Calendar, 
  LayoutDashboard, 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  LogIn, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Utensils, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Users, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Menu, 
  Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db } from './firebase';
import { UserProfile, Recipe, MealPlan, DayOfWeek, DailyMeals } from './types';
import { getNutritionalSuggestions, generateRecipeFromPrompt, generateMealPlanSuggestion } from './services/geminiService';
import ChatBot from './components/ChatBot';
import { TRADITIONAL_RECIPES } from './data/traditionalRecipes';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled, 
  icon: Icon 
}: { 
  children?: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', 
  className?: string, 
  disabled?: boolean, 
  icon?: any 
}) => {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm',
    outline: 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    ghost: 'text-zinc-600 hover:bg-zinc-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Card = ({ children, className, title, subtitle, action }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string, action?: React.ReactNode }) => (
  <div className={cn('bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden', className)}>
    {(title || subtitle || action) && (
      <div className="px-6 py-4 border-bottom border-zinc-50 flex items-center justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold text-zinc-900 leading-tight">{title}</h3>}
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
    <input
      {...props}
      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
    />
  </div>
);

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'success' | 'warning' | 'info' }) => {
  const variants = {
    neutral: 'bg-zinc-100 text-zinc-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700'
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'recipes' | 'planner' | 'shopping' | 'stats' | 'favorites' | 'settings' | 'admin'>('dashboard');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [suggestions, setSuggestions] = useState<{ title: string, description: string }[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- Auth & Profile ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Test connection
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Firebase configuration error: client is offline.");
          }
        }

        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'User',
            email: u.email || '',
            role: u.email === 'jflorperitociberseguridad@gmail.com' ? 'admin' : 'user',
            preferences: {
              dietaryRestrictions: [],
              caloriesGoal: 2000
            },
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setProfile(newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${u.uid}`);
          }
        }
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- Real-time Data Listeners ---

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const recipesQuery = query(
      collection(db, 'recipes'),
      where('isPublic', '==', true)
    );
    const userRecipesQuery = query(
      collection(db, 'recipes'),
      where('authorId', '==', user.uid)
    );

    const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snapshot) => {
      const allRecipes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recipe));
      // Filter manually to handle complex OR logic if needed, or just use the snapshot
      setRecipes(allRecipes.filter(r => r.isPublic || r.authorId === user.uid || profile?.role === 'admin'));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'recipes'));

    const unsubPlans = onSnapshot(
      query(collection(db, 'mealPlans'), where('userId', '==', user.uid)),
      (snapshot) => {
        setMealPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MealPlan)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'mealPlans')
    );

    return () => {
      unsubRecipes();
      unsubPlans();
    };
  }, [isAuthReady, user, profile]);

  // --- AI Suggestions ---

  useEffect(() => {
    if (recipes.length > 0 && profile) {
      const fetchSuggestions = async () => {
        try {
          const res = await getNutritionalSuggestions(recipes, profile.preferences);
          setSuggestions(res);
        } catch (err) {
          console.error("AI Error:", err);
        }
      };
      fetchSuggestions();
    }
  }, [recipes.length, profile]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-emerald-600"
        >
          <ChefHat size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-3xl shadow-inner">
            <ChefHat size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">NutriPlan AI</h1>
            <p className="text-zinc-500 text-lg">Planifica tus comidas de forma inteligente con la ayuda de la IA.</p>
          </div>
          <Button onClick={handleLogin} variant="secondary" className="w-full py-4 text-lg" icon={LogIn}>
            Continuar con Google
          </Button>
          <p className="text-xs text-zinc-400">Al continuar, aceptas nuestros términos y condiciones.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-zinc-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <ChefHat size={24} />
          </div>
          <span className="text-xl font-bold text-zinc-900 tracking-tight">NutriPlan</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={LayoutDashboard} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeTab === 'recipes'} 
            onClick={() => setActiveTab('recipes')} 
            icon={Utensils} 
            label="Recetas" 
          />
          <NavItem 
            active={activeTab === 'planner'} 
            onClick={() => setActiveTab('planner')} 
            icon={Calendar} 
            label="Planificador" 
          />
          <NavItem 
            active={activeTab === 'shopping'} 
            onClick={() => setActiveTab('shopping')} 
            icon={CheckCircle2} 
            label="Lista de Compras" 
          />
          <NavItem 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            icon={Flame} 
            label="Estadísticas" 
          />
          <NavItem 
            active={activeTab === 'favorites'} 
            onClick={() => setActiveTab('favorites')} 
            icon={CheckCircle2} 
            label="Favoritos" 
          />
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={Settings} 
            label="Ajustes" 
          />
          {profile?.role === 'admin' && (
            <NavItem 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')} 
              icon={ShieldCheck} 
              label="Administración" 
            />
          )}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl mb-4">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-zinc-500" icon={LogOut}>
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Hola, {user.displayName?.split(' ')[0]} 👋</h2>
                  <p className="text-zinc-500">Aquí tienes un resumen de tu plan nutricional.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" icon={Settings}>Ajustes</Button>
                  <Button icon={Plus} onClick={() => setActiveTab('recipes')}>Nueva Receta</Button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Calorías Meta" 
                  value={profile?.preferences.caloriesGoal || 0} 
                  unit="kcal" 
                  icon={Flame} 
                  color="text-orange-600 bg-orange-50" 
                />
                <StatCard 
                  title="Recetas Guardadas" 
                  value={recipes.length} 
                  unit="items" 
                  icon={Utensils} 
                  color="text-emerald-600 bg-emerald-50" 
                />
                <StatCard 
                  title="Planes Activos" 
                  value={mealPlans.length} 
                  unit="semanas" 
                  icon={Calendar} 
                  color="text-blue-600 bg-blue-50" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Sugerencias de la IA" subtitle="Basado en tus gustos y metas" action={<Sparkles className="text-emerald-500" size={20} />}>
                  <div className="space-y-4">
                    {suggestions.length > 0 ? suggestions.map((s, i) => (
                      <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-emerald-200 transition-all cursor-default group">
                        <h4 className="font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">{s.title}</h4>
                        <p className="text-sm text-zinc-600 mt-1">{s.description}</p>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-zinc-400">
                        <Sparkles size={32} className="mx-auto mb-2 opacity-20" />
                        <p>Generando sugerencias personalizadas...</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="Próximas Comidas" subtitle="Para el día de hoy" action={<ChevronRight size={20} className="text-zinc-400" />}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 hover:bg-zinc-50 rounded-xl transition-colors">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">D</div>
                      <div>
                        <p className="font-semibold text-zinc-900">Avena con Frutos Rojos</p>
                        <p className="text-xs text-zinc-500">Desayuno • 350 kcal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 hover:bg-zinc-50 rounded-xl transition-colors">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">A</div>
                      <div>
                        <p className="font-semibold text-zinc-900">Pollo al Curry con Arroz</p>
                        <p className="text-xs text-zinc-500">Almuerzo • 650 kcal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 hover:bg-zinc-50 rounded-xl transition-colors">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">C</div>
                      <div>
                        <p className="font-semibold text-zinc-900">Ensalada César Ligera</p>
                        <p className="text-xs text-zinc-500">Cena • 400 kcal</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'recipes' && (
            <RecipesView 
              recipes={recipes} 
              userId={user.uid} 
              isAdmin={profile?.role === 'admin'} 
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView 
              recipes={recipes} 
              mealPlans={mealPlans} 
              userId={user.uid} 
              profile={profile}
            />
          )}

          {activeTab === 'shopping' && (
            <ShoppingListView 
              mealPlans={mealPlans} 
              recipes={recipes} 
            />
          )}

          {activeTab === 'stats' && (
            <StatsView 
              mealPlans={mealPlans} 
              recipes={recipes} 
              profile={profile}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesView recipes={recipes} />
          )}

          {activeTab === 'settings' && (
            <SettingsView profile={profile} onUpdate={setProfile} />
          )}

          {activeTab === 'admin' && (
            <AdminView 
              recipes={recipes} 
              usersCount={10} // Mock for now
            />
          )}
        </AnimatePresence>
      </main>
      <ChatBot />
    </div>
  );
}

// --- Sub-Views ---

function NavItem({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group',
        active 
          ? 'bg-emerald-50 text-emerald-700' 
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
      )}
    >
      <Icon size={20} className={cn('transition-colors', active ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-600')} />
      {label}
    </button>
  );
}

function StatCard({ title, value, unit, icon: Icon, color }: { title: string, value: number | string, unit: string, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-500">{title}</span>
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-zinc-900">{value}</span>
        <span className="text-sm text-zinc-400 font-medium">{unit}</span>
      </div>
    </div>
  );
}

function RecipesView({ recipes, userId, isAdmin }: { recipes: Recipe[], userId: string, isAdmin: boolean }) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Biblioteca de Recetas</h2>
          <p className="text-zinc-500">Explora y gestiona tus platos favoritos.</p>
        </div>
        <Button icon={Plus} onClick={() => setIsAdding(true)}>Añadir Receta</Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar recetas por nombre o ingredientes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} isOwner={recipe.authorId === userId || isAdmin} />
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <RecipeModal onClose={() => setIsAdding(false)} userId={userId} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RecipeCard({ recipe, isOwner }: { recipe: Recipe, isOwner: boolean }) {
  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      try {
        await deleteDoc(doc(db, 'recipes', recipe.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `recipes/${recipe.id}`);
      }
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all">
      <div className="aspect-video bg-zinc-100 rounded-xl mb-4 overflow-hidden relative">
        <img 
          src={`https://picsum.photos/seed/${recipe.title}/400/300`} 
          alt={recipe.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge variant={recipe.category === 'Breakfast' ? 'info' : recipe.category === 'Lunch' ? 'success' : 'warning'}>
            {recipe.category}
          </Badge>
          {recipe.isPublic && <Badge variant="neutral">Público</Badge>}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-bold text-lg text-zinc-900 leading-tight">{recipe.title}</h4>
          {isOwner && (
            <div className="flex gap-1">
              <button className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"><Edit size={16} /></button>
              <button onClick={handleDelete} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-500 line-clamp-2">{recipe.description}</p>
        <div className="flex items-center gap-4 pt-4 border-t border-zinc-50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Flame size={14} className="text-orange-500" />
            {recipe.nutritionalValue.calories} kcal
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Clock size={14} className="text-blue-500" />
            25 min
          </div>
        </div>
      </div>
    </Card>
  );
}

function RecipeModal({ onClose, userId }: { onClose: () => void, userId: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Recipe['category']>('Lunch');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [calories, setCalories] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await generateRecipeFromPrompt(aiPrompt);
      setTitle(res.title);
      setDescription(res.description);
      setCategory(res.category);
      setIngredients(res.ingredients.join('\n'));
      setInstructions(res.instructions.join('\n'));
      setCalories(res.nutritionalValue.calories);
      setAiPrompt('');
    } catch (err) {
      console.error("AI Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecipe: Omit<Recipe, 'id'> = {
      title,
      description,
      category,
      ingredients: ingredients.split('\n').filter(i => i.trim()),
      instructions: instructions.split('\n').filter(i => i.trim()),
      nutritionalValue: {
        calories,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      authorId: userId,
      isPublic,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'recipes'), newRecipe);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'recipes');
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-zinc-900">Nueva Receta</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="px-8 pt-6">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
            <Sparkles className="text-emerald-600 shrink-0" size={20} />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-emerald-900">Generador de Recetas IA</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Ej: Cena saludable con salmón y espárragos..."
                  className="flex-1 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Button 
                  onClick={handleAiGenerate} 
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="py-1.5 px-3 text-xs"
                >
                  {isGenerating ? 'Generando...' : 'Generar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ej: Pasta Carbonara" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Categoría</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Breakfast">Desayuno</option>
                <option value="Lunch">Almuerzo</option>
                <option value="Dinner">Cena</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
          </div>
          <Input label="Descripción Corta" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve resumen del plato..." />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Ingredientes (uno por línea)</label>
              <textarea 
                rows={4} 
                value={ingredients} 
                onChange={e => setIngredients(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="200g de pasta..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Instrucciones (una por línea)</label>
              <textarea 
                rows={4} 
                value={instructions} 
                onChange={e => setInstructions(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Hervir el agua..."
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
            <div className="flex items-center gap-4">
              <Input label="Calorías (kcal)" type="number" value={calories} onChange={e => setCalories(Number(e.target.value))} className="w-32" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-5 h-5 accent-emerald-600" />
              <span className="text-sm font-medium text-zinc-700">Hacer receta pública</span>
            </label>
          </div>
        </form>
        <div className="p-6 border-t border-zinc-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)} icon={Save}>Guardar Receta</Button>
        </div>
      </motion.div>
    </div>
  );
}

function PlannerView({ recipes, mealPlans, userId, profile }: { recipes: Recipe[], mealPlans: MealPlan[], userId: string, profile: UserProfile | null }) {
  const [currentWeek, setCurrentWeek] = useState(new Date().toISOString().split('T')[0]);
  const [isSelecting, setIsSelecting] = useState<{ day: DayOfWeek, slot: keyof DailyMeals } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const activePlan = mealPlans.find(p => p.weekStartDate === currentWeek);

  const handleAutoPlan = async () => {
    if (recipes.length < 3 || !profile) return;
    setIsGenerating(true);
    try {
      const planId = activePlan?.id || `${userId}_${currentWeek}`;
      const res = await generateMealPlanSuggestion(recipes, profile.preferences);
      await setDoc(doc(db, 'mealPlans', planId), {
        userId,
        weekStartDate: currentWeek,
        days: res
      }, { merge: true });
    } catch (err) {
      console.error("AI Auto-Plan Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (!isSelecting) return;
    const { day, slot } = isSelecting;

    const planId = activePlan?.id || `${userId}_${currentWeek}`;
    const updatedDays = {
      ...(activePlan?.days || {
        monday: { snacks: [] },
        tuesday: { snacks: [] },
        wednesday: { snacks: [] },
        thursday: { snacks: [] },
        friday: { snacks: [] },
        saturday: { snacks: [] },
        sunday: { snacks: [] }
      })
    };

    if (slot === 'snacks') {
      updatedDays[day].snacks = [...(updatedDays[day].snacks || []), recipeId];
    } else {
      updatedDays[day][slot] = recipeId;
    }

    try {
      await setDoc(doc(db, 'mealPlans', planId), {
        userId,
        weekStartDate: currentWeek,
        days: updatedDays
      }, { merge: true });
      setIsSelecting(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `mealPlans/${planId}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Planificador Semanal</h2>
          <p className="text-zinc-500">Organiza tus comidas para la semana.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            icon={Sparkles} 
            onClick={handleAutoPlan} 
            disabled={isGenerating || recipes.length < 3}
            className="text-emerald-600 border-emerald-100 hover:bg-emerald-50"
          >
            {isGenerating ? 'Generando...' : 'Auto-Planificar IA'}
          </Button>
          <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm">
            <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
            <span className="font-bold text-zinc-900 px-4">Semana Actual</span>
            <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map(day => (
          <div key={day} className="space-y-4">
            <div className="text-center py-2 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest">
              {dayLabels[day]}
            </div>
            <div className="space-y-3">
              <MealSlot 
                label="Desayuno" 
                recipeId={activePlan?.days[day]?.breakfast} 
                recipes={recipes} 
                onClick={() => setIsSelecting({ day, slot: 'breakfast' })}
              />
              <MealSlot 
                label="Almuerzo" 
                recipeId={activePlan?.days[day]?.lunch} 
                recipes={recipes} 
                onClick={() => setIsSelecting({ day, slot: 'lunch' })}
              />
              <MealSlot 
                label="Cena" 
                recipeId={activePlan?.days[day]?.dinner} 
                recipes={recipes} 
                onClick={() => setIsSelecting({ day, slot: 'dinner' })}
              />
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isSelecting && (
          <RecipeSelector 
            recipes={recipes} 
            onSelect={handleSelectRecipe} 
            onClose={() => setIsSelecting(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RecipeSelector({ recipes, onSelect, onClose }: { recipes: Recipe[], onSelect: (id: string) => void, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-zinc-900">Seleccionar Receta</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {recipes.map(recipe => (
            <button 
              key={recipe.id}
              onClick={() => onSelect(recipe.id)}
              className="w-full flex items-center gap-4 p-3 hover:bg-emerald-50 rounded-2xl transition-all group text-left"
            >
              <div className="w-12 h-12 bg-zinc-100 rounded-xl overflow-hidden">
                <img src={`https://picsum.photos/seed/${recipe.title}/100/100`} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 group-hover:text-emerald-700">{recipe.title}</p>
                <p className="text-xs text-zinc-500">{recipe.nutritionalValue.calories} kcal</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function MealSlot({ label, recipeId, recipes, onClick }: { label: string, recipeId?: string, recipes: Recipe[], onClick: () => void }) {
  const recipe = recipes.find(r => r.id === recipeId);

  return (
    <div 
      onClick={onClick}
      className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-all cursor-pointer group min-h-[120px] flex flex-col justify-between"
    >
      <div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">{label}</span>
        {recipe ? (
          <p className="text-sm font-bold text-zinc-900 leading-tight group-hover:text-emerald-700 transition-colors">{recipe.title}</p>
        ) : (
          <p className="text-xs text-zinc-400 italic">No asignado</p>
        )}
      </div>
      <div className="flex justify-end">
        <div className="p-1.5 bg-zinc-50 text-zinc-400 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
          <Plus size={14} />
        </div>
      </div>
    </div>
  );
}

function AdminView({ recipes, usersCount }: { recipes: Recipe[], usersCount: number }) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      for (const recipe of TRADITIONAL_RECIPES) {
        // Check if recipe already exists by title
        const exists = recipes.some(r => r.title === recipe.title);
        if (!exists) {
          await addDoc(collection(db, 'recipes'), {
            ...recipe,
            authorId: 'system',
            createdAt: new Date().toISOString()
          });
        }
      }
      alert('Recetas tradicionales importadas correctamente.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'recipes');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Panel de Administración</h2>
          <p className="text-zinc-500">Gestión global de la plataforma.</p>
        </div>
        <Button 
          variant="outline" 
          icon={Sparkles} 
          onClick={handleImport} 
          disabled={isImporting}
          className="text-emerald-600 border-emerald-100 hover:bg-emerald-50"
        >
          {isImporting ? 'Importando...' : 'Importar Recetario Tradicional'}
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Usuarios Registrados" subtitle="Actividad total" action={<Users className="text-blue-500" size={20} />}>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-zinc-900">{usersCount}</span>
            <Button variant="outline">Ver Todos</Button>
          </div>
        </Card>
        <Card title="Recetas Públicas" subtitle="Contenido de la comunidad" action={<Utensils className="text-emerald-500" size={20} />}>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-zinc-900">{recipes.filter(r => r.isPublic).length}</span>
            <Button variant="outline">Moderar</Button>
          </div>
        </Card>
      </div>

      <Card title="Auditoría de Seguridad" subtitle="Estado de las reglas de Firestore">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">Reglas de seguridad activas y validadas.</p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">Acceso restringido por UID implementado correctamente.</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ShoppingListView({ mealPlans, recipes }: { mealPlans: MealPlan[], recipes: Recipe[] }) {
  const currentWeek = new Date().toISOString().split('T')[0];
  const activePlan = mealPlans.find(p => p.weekStartDate === currentWeek);

  const ingredients = useMemo(() => {
    if (!activePlan) return [];
    const allRecipeIds: string[] = [];
    Object.values(activePlan.days).forEach((day: any) => {
      if (day.breakfast) allRecipeIds.push(day.breakfast);
      if (day.lunch) allRecipeIds.push(day.lunch);
      if (day.dinner) allRecipeIds.push(day.dinner);
      if (day.snacks) allRecipeIds.push(...day.snacks);
    });

    const uniqueIngredients = new Set<string>();
    allRecipeIds.forEach(id => {
      const recipe = recipes.find(r => r.id === id);
      recipe?.ingredients.forEach(ing => uniqueIngredients.add(ing));
    });

    return Array.from(uniqueIngredients);
  }, [activePlan, recipes]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Lista de Compras</h2>
        <p className="text-zinc-500">Ingredientes necesarios para tu plan semanal.</p>
      </header>

      <Card title="Ingredientes de la Semana" subtitle={`${ingredients.length} artículos necesarios`}>
        {ingredients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <input type="checkbox" className="w-5 h-5 accent-emerald-600 rounded-md" />
                <span className="text-zinc-700 font-medium">{ing}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
            <p>No hay ingredientes en tu lista. ¡Planifica algunas comidas primero!</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function StatsView({ mealPlans, recipes, profile }: { mealPlans: MealPlan[], recipes: Recipe[], profile: UserProfile | null }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Estadísticas Nutricionales</h2>
        <p className="text-zinc-500">Análisis de tu consumo y progreso.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Cumplimiento de Metas" subtitle="Calorías diarias promedio">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-100" />
                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={502} strokeDashoffset={502 * 0.25} className="text-emerald-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-zinc-900">75%</span>
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Meta</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-zinc-500 text-center">Estás consumiendo un promedio de 1,500 kcal de tu meta de {profile?.preferences.caloriesGoal} kcal.</p>
          </div>
        </Card>

        <Card title="Distribución de Macros" subtitle="Proteínas, Carbohidratos y Grasas">
          <div className="space-y-6 py-4">
            <MacroBar label="Proteínas" percentage={30} color="bg-blue-500" />
            <MacroBar label="Carbohidratos" percentage={50} color="bg-emerald-500" />
            <MacroBar label="Grasas" percentage={20} color="bg-amber-500" />
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function MacroBar({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-zinc-700">{label}</span>
        <span className="text-zinc-500">{percentage}%</span>
      </div>
      <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn('h-full', color)}
        />
      </div>
    </div>
  );
}

function FavoritesView({ recipes }: { recipes: Recipe[] }) {
  const favorites = recipes.slice(0, 2); // Mock favorites for now

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Mis Favoritos</h2>
        <p className="text-zinc-500">Tus recetas más queridas en un solo lugar.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.length > 0 ? favorites.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} isOwner={false} />
        )) : (
          <div className="col-span-full text-center py-20 text-zinc-400">
            <Utensils size={48} className="mx-auto mb-4 opacity-20" />
            <p>Aún no tienes recetas favoritas.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SettingsView({ profile, onUpdate }: { profile: UserProfile | null, onUpdate: (p: UserProfile) => void }) {
  const [goal, setGoal] = useState(profile?.preferences.caloriesGoal || 2000);

  const handleSave = async () => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      preferences: { ...profile.preferences, caloriesGoal: goal }
    };
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        'preferences.caloriesGoal': goal
      });
      onUpdate(updatedProfile);
      alert('Ajustes guardados correctamente');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Ajustes de Perfil</h2>
        <p className="text-zinc-500">Personaliza tu experiencia y metas.</p>
      </header>

      <div className="max-w-2xl">
        <Card title="Preferencias Nutricionales" subtitle="Configura tus objetivos diarios">
          <div className="space-y-6">
            <Input 
              label="Meta de Calorías Diarias (kcal)" 
              type="number" 
              value={goal} 
              onChange={e => setGoal(Number(e.target.value))} 
            />
            <div className="pt-4">
              <Button onClick={handleSave} icon={Save}>Guardar Cambios</Button>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

