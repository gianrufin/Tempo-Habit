import React, { useState, useEffect } from 'react';
import {
  Habit,
  HabitCompletion,
  Routine,
  Task,
  Goal,
  MoodRecord,
  UserPreferences,
  HabitCompletionStatus,
  MoodValue,
} from './types';
import { StorageService } from './data/storage';
import { formatLocalDate, isEligibleOn, addDays } from './domain/recurrenceEngine';
import { playSound, playCelebrationSound } from './audio/soundPlayer';

// Components
import { TopBar } from './components/TopBar';
import { FloatingBottomNav, TabType } from './components/FloatingBottomNav';

// Screens
import { TodayScreen } from './screens/TodayScreen';
import { TasksScreen } from './screens/TasksScreen';
import { TimerScreen } from './screens/TimerScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { GoalsScreen } from './screens/GoalsScreen';

// Modals
import { AddEditHabitModal } from './components/Modals/AddEditHabitModal';
import { AddEditRoutineModal } from './components/Modals/AddEditRoutineModal';
import { AddEditTaskModal } from './components/Modals/AddEditTaskModal';
import { AddEditGoalModal } from './components/Modals/AddEditGoalModal';
import { HabitDetailModal } from './components/Modals/HabitDetailModal';
import { QuickAddModal } from './components/Modals/QuickAddModal';
import { RecapModal } from './components/Modals/RecapModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { SearchModal } from './components/Modals/SearchModal';
import { ReadmeModal } from './components/Modals/ReadmeModal';

export const App: React.FC = () => {
  // Primary persistent state
  const [habits, setHabits] = useState<Habit[]>(() => StorageService.getHabits());
  const [routines, setRoutines] = useState<Routine[]>(() => StorageService.getRoutines());
  const [completions, setCompletions] = useState<HabitCompletion[]>(() => StorageService.getCompletions());
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [goals, setGoals] = useState<Goal[]>(() => StorageService.getGoals());
  const [moods, setMoods] = useState<MoodRecord[]>(() => StorageService.getMoods());
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => StorageService.getPreferences());

  // Navigation and active date
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDate(new Date()));

  // Modal visibility states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [readmeModalOpen, setReadmeModalOpen] = useState(false);

  const [habitDetailOpen, setHabitDetailOpen] = useState(false);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<Habit | null>(null);

  const [addEditHabitOpen, setAddEditHabitOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [addEditRoutineOpen, setAddEditRoutineOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const [addEditTaskOpen, setAddEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [addEditGoalOpen, setAddEditGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Sync to localStorage
  useEffect(() => {
    StorageService.saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    StorageService.saveRoutines(routines);
  }, [routines]);

  useEffect(() => {
    StorageService.saveCompletions(completions);
  }, [completions]);

  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    StorageService.saveGoals(goals);
  }, [goals]);

  useEffect(() => {
    StorageService.saveMoods(moods);
  }, [moods]);

  useEffect(() => {
    StorageService.savePreferences(userPrefs);
  }, [userPrefs]);

  // Reload all states from storage (used after backup restore or reset)
  const refreshAllData = () => {
    setHabits(StorageService.getHabits());
    setRoutines(StorageService.getRoutines());
    setCompletions(StorageService.getCompletions());
    setTasks(StorageService.getTasks());
    setGoals(StorageService.getGoals());
    setMoods(StorageService.getMoods());
    setUserPrefs(StorageService.getPreferences());
  };

  // --- Habit Completions Handler ---
  const handleToggleHabitStatus = (
    habitId: string,
    date: string,
    newStatus: HabitCompletionStatus | null
  ) => {
    const existingIndex = completions.findIndex(c => c.habitId === habitId && c.date === date);

    if (newStatus === null) {
      // Remove completion record
      if (existingIndex >= 0) {
        const updated = [...completions];
        updated.splice(existingIndex, 1);
        setCompletions(updated);
      }
      return;
    }

    if (newStatus === 'COMPLETED' && userPrefs.soundEnabled) {
      playSound(userPrefs.soundChoice, 0.6);
    }

    if (existingIndex >= 0) {
      // Update existing record
      const updated = [...completions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      };
      setCompletions(updated);
    } else {
      // Create new record
      const newCompletion: HabitCompletion = {
        id: `comp-${habitId}-${date}`,
        habitId,
        date,
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      };
      setCompletions([...completions, newCompletion]);
    }
  };

  // --- Mood Logging ---
  const handleSaveMood = (mood: MoodValue, note?: string) => {
    const existingIndex = moods.findIndex(m => m.date === selectedDate);
    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated = [...moods];
      updated[existingIndex] = {
        date: selectedDate,
        mood,
        note,
        updatedAt: nowIso,
      };
      setMoods(updated);
    } else {
      setMoods([...moods, { date: selectedDate, mood, note, updatedAt: nowIso }]);
    }
  };

  // --- Habit CRUD ---
  const handleSaveHabit = (savedHabit: Habit) => {
    const index = habits.findIndex(h => h.id === savedHabit.id);
    if (index >= 0) {
      const updated = [...habits];
      updated[index] = savedHabit;
      setHabits(updated);
    } else {
      setHabits([...habits, savedHabit]);
    }
    setAddEditHabitOpen(false);
    setEditingHabit(null);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
    // Remove habit from routines
    setRoutines(
      routines.map(r => ({
        ...r,
        habitIds: r.habitIds.filter(id => id !== habitId),
      }))
    );
    // Remove habit from completions
    setCompletions(completions.filter(c => c.habitId !== habitId));
    setHabitDetailOpen(false);
    setSelectedHabitForDetail(null);
    setAddEditHabitOpen(false);
    setEditingHabit(null);
  };

  const handleTogglePauseHabit = (habitId: string, days: number | null) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const pausedUntil = days ? formatLocalDate(addDays(new Date(), days)) : null;
        return { ...h, pausedUntil };
      }
      return h;
    });
    setHabits(updated);
    if (selectedHabitForDetail && selectedHabitForDetail.id === habitId) {
      setSelectedHabitForDetail(updated.find(h => h.id === habitId) || null);
    }
  };

  // --- Routine CRUD ---
  const handleSaveRoutine = (savedRoutine: Routine) => {
    const index = routines.findIndex(r => r.id === savedRoutine.id);
    if (index >= 0) {
      const updated = [...routines];
      updated[index] = savedRoutine;
      setRoutines(updated);
    } else {
      setRoutines([...routines, savedRoutine]);
    }
    setAddEditRoutineOpen(false);
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines(routines.filter(r => r.id !== routineId));
    setAddEditRoutineOpen(false);
    setEditingRoutine(null);
  };

  const handleAddHabitToRoutine = (routineId: string) => {
    const targetRoutine = routines.find(r => r.id === routineId);
    if (targetRoutine) {
      setEditingRoutine(targetRoutine);
      setAddEditRoutineOpen(true);
    }
  };

  // --- Task CRUD ---
  const handleToggleTask = (taskId: string) => {
    setTasks(
      tasks.map(t => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          if (nextCompleted && userPrefs.soundEnabled) {
            playSound(userPrefs.soundChoice, 0.6);
          }
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleToggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks(
      tasks.map(t => {
        if (t.id === taskId) {
          const updatedList = t.checklist.map(c => (c.id === itemId ? { ...c, done: !c.done } : c));
          const allDone = updatedList.length > 0 && updatedList.every(c => c.done);
          return {
            ...t,
            checklist: updatedList,
            completed: allDone,
          };
        }
        return t;
      })
    );
  };

  const handleSaveTask = (savedTask: Task) => {
    const index = tasks.findIndex(t => t.id === savedTask.id);
    if (index >= 0) {
      const updated = [...tasks];
      updated[index] = savedTask;
      setTasks(updated);
    } else {
      setTasks([...tasks, savedTask]);
    }
    setAddEditTaskOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // --- Goal CRUD ---
  const handleSaveGoal = (savedGoal: Goal) => {
    const index = goals.findIndex(g => g.id === savedGoal.id);
    if (index >= 0) {
      const updated = [...goals];
      updated[index] = savedGoal;
      setGoals(updated);
    } else {
      setGoals([...goals, savedGoal]);
    }
    setAddEditGoalOpen(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
  };

  // --- TopBar Stats ---
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const activeHabitsForSelectedDate = habits.filter(h =>
    isEligibleOn(h.recurrenceRule, selectedDateObj, h.createdAt)
  );
  const completedCountToday = completions.filter(
    c => c.date === selectedDate && c.status === 'COMPLETED'
  ).length;

  return (
    <div className="min-h-screen bg-[#0b0714] text-zinc-100 font-sans selection:bg-purple-600 selection:text-white relative">
      {/* Background Ambient Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-950/25 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Sticky TopBar */}
        <TopBar
          userPrefs={userPrefs}
          selectedDate={selectedDate}
          activeHabitCount={activeHabitsForSelectedDate.length}
          completedTodayCount={completedCountToday}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenReadme={() => setReadmeModalOpen(true)}
        />

        {/* Main Screen Content */}
        <main className="flex-1">
          {activeTab === 'today' && (
            <TodayScreen
              habits={habits}
              routines={routines}
              completions={completions}
              moods={moods}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onToggleHabitStatus={handleToggleHabitStatus}
              onSaveMood={handleSaveMood}
              onOpenHabitDetail={h => {
                setSelectedHabitForDetail(h);
                setHabitDetailOpen(true);
              }}
              onOpenAddHabit={() => {
                setEditingHabit(null);
                setAddEditHabitOpen(true);
              }}
              onOpenAddRoutine={() => {
                setEditingRoutine(null);
                setAddEditRoutineOpen(true);
              }}
              onOpenQuickAdd={() => setQuickAddModalOpen(true)}
              onAddHabitToRoutine={handleAddHabitToRoutine}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksScreen
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onToggleChecklistItem={handleToggleChecklistItem}
              onOpenAddTask={() => {
                setEditingTask(null);
                setAddEditTaskOpen(true);
              }}
              onOpenEditTask={t => {
                setEditingTask(t);
                setAddEditTaskOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'timer' && (
            <TimerScreen
              habits={habits}
              userPrefs={userPrefs}
              onCompleteHabit={habitId =>
                handleToggleHabitStatus(habitId, formatLocalDate(new Date()), 'COMPLETED')
              }
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarScreen
              habits={habits}
              completions={completions}
              moods={moods}
              onToggleHabitStatus={handleToggleHabitStatus}
              onOpenHabitDetail={h => {
                setSelectedHabitForDetail(h);
                setHabitDetailOpen(true);
              }}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsScreen
              habits={habits}
              completions={completions}
              moods={moods}
              goals={goals}
              onOpenRecap={() => setRecapModalOpen(true)}
              onOpenHabitDetail={h => {
                setSelectedHabitForDetail(h);
                setHabitDetailOpen(true);
              }}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsScreen
              goals={goals}
              habits={habits}
              completions={completions}
              onOpenAddGoal={() => {
                setEditingGoal(null);
                setAddEditGoalOpen(true);
              }}
              onOpenEditGoal={g => {
                setEditingGoal(g);
                setAddEditGoalOpen(true);
              }}
              onDeleteGoal={handleDeleteGoal}
              onOpenHabitDetail={h => {
                setSelectedHabitForDetail(h);
                setHabitDetailOpen(true);
              }}
            />
          )}
        </main>

        {/* Bottom Floating Navigation */}
        <FloatingBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* --- Modals & Sheets --- */}
      <HabitDetailModal
        habit={selectedHabitForDetail}
        completions={completions}
        isOpen={habitDetailOpen}
        onClose={() => {
          setHabitDetailOpen(false);
          setSelectedHabitForDetail(null);
        }}
        onEdit={h => {
          setHabitDetailOpen(false);
          setEditingHabit(h);
          setAddEditHabitOpen(true);
        }}
        onDelete={handleDeleteHabit}
        onTogglePause={handleTogglePauseHabit}
      />

      <AddEditHabitModal
        habit={editingHabit}
        isOpen={addEditHabitOpen}
        onClose={() => {
          setAddEditHabitOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />

      <AddEditRoutineModal
        routine={editingRoutine}
        habits={habits}
        isOpen={addEditRoutineOpen}
        onClose={() => {
          setAddEditRoutineOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSaveRoutine}
        onDelete={handleDeleteRoutine}
      />

      <AddEditTaskModal
        task={editingTask}
        isOpen={addEditTaskOpen}
        onClose={() => {
          setAddEditTaskOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <AddEditGoalModal
        goal={editingGoal}
        habits={habits}
        isOpen={addEditGoalOpen}
        onClose={() => {
          setAddEditGoalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
      />

      <QuickAddModal
        isOpen={quickAddModalOpen}
        onClose={() => setQuickAddModalOpen(false)}
        onAddFromTemplate={handleSaveHabit}
      />

      <RecapModal
        isOpen={recapModalOpen}
        onClose={() => setRecapModalOpen(false)}
        habits={habits}
        completions={completions}
        moods={moods}
        displayName={userPrefs.displayName}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        userPrefs={userPrefs}
        onSavePreferences={setUserPrefs}
        onDataImported={refreshAllData}
        onOpenReadme={() => setReadmeModalOpen(true)}
      />

      <ReadmeModal
        isOpen={readmeModalOpen}
        onClose={() => setReadmeModalOpen(false)}
        onOpenSettingsUpdates={() => {
          setReadmeModalOpen(false);
          setSettingsModalOpen(true);
        }}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        habits={habits}
        tasks={tasks}
        routines={routines}
        goals={goals}
        onSelectHabit={h => {
          setSelectedHabitForDetail(h);
          setHabitDetailOpen(true);
        }}
        onSelectTask={t => {
          setActiveTab('tasks');
        }}
        onSelectRoutine={r => {
          setActiveTab('today');
        }}
        onSelectGoal={g => {
          setActiveTab('goals');
        }}
      />
    </div>
  );
};
