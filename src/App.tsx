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
} from './types';
import { StorageService } from './data/storage';
import { formatLocalDate } from './domain/recurrenceEngine';
import { playSound, playCelebrationSound } from './audio/soundPlayer';

// Components & Icons
import { TopBar } from './components/TopBar';
import { FloatingBottomNav, ActiveTab } from './components/FloatingBottomNav';

// Screens
import { TodayScreen } from './screens/TodayScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { TimerScreen } from './screens/TimerScreen';
import { InsightsScreen } from './screens/InsightsScreen';

// Modals
import { AddEditHabitModal } from './components/Modals/AddEditHabitModal';
import { AddEditRoutineModal } from './components/Modals/AddEditRoutineModal';
import { AddEditTaskModal } from './components/Modals/AddEditTaskModal';
import { QuickAddModal } from './components/Modals/QuickAddModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { SearchModal } from './components/Modals/SearchModal';
import { UpdateModal } from './components/Modals/UpdateModal';

export const App: React.FC = () => {
  // Primary persistent state (Starts clean from scratch)
  const [habits, setHabits] = useState<Habit[]>(() => StorageService.getHabits());
  const [routines, setRoutines] = useState<Routine[]>(() => StorageService.getRoutines());
  const [completions, setCompletions] = useState<HabitCompletion[]>(() => StorageService.getCompletions());
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [goals, setGoals] = useState<Goal[]>(() => StorageService.getGoals());
  const [moods, setMoods] = useState<MoodRecord[]>(() => StorageService.getMoods());
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => StorageService.getPreferences());

  // Active tab & date
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDate(new Date()));

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);

  const [addEditHabitOpen, setAddEditHabitOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [addEditRoutineOpen, setAddEditRoutineOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const [addEditTaskOpen, setAddEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sync theme changes to HTML root class
  useEffect(() => {
    if (userPrefs.theme === 'dark' || userPrefs.theme === 'amoled') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userPrefs.theme]);

  // Sync states to Storage
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

  const refreshAllData = () => {
    setHabits(StorageService.getHabits());
    setRoutines(StorageService.getRoutines());
    setCompletions(StorageService.getCompletions());
    setTasks(StorageService.getTasks());
    setGoals(StorageService.getGoals());
    setMoods(StorageService.getMoods());
    setUserPrefs(StorageService.getPreferences());
  };

  // Toggle habit completion on a given date
  const handleToggleHabit = (habitId: string, date: string = selectedDate) => {
    const existingIndex = completions.findIndex(c => c.habitId === habitId && c.date === date);

    if (existingIndex >= 0) {
      // Toggle off
      const updated = [...completions];
      updated.splice(existingIndex, 1);
      setCompletions(updated);
    } else {
      // Mark completed
      if (userPrefs.soundEnabled) {
        playSound(userPrefs.soundChoice, 0.6);
        playCelebrationSound();
      }
      const newCompletion: HabitCompletion = {
        id: `comp-${Date.now()}-${habitId}`,
        habitId,
        date,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      };
      setCompletions([...completions, newCompletion]);
    }
  };

  // Habit CRUD
  const handleSaveHabit = (habit: Habit) => {
    const index = habits.findIndex(h => h.id === habit.id);
    if (index >= 0) {
      const updated = [...habits];
      updated[index] = habit;
      setHabits(updated);
    } else {
      setHabits([...habits, habit]);
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
    setCompletions(completions.filter(c => c.habitId !== habitId));
  };

  // Routine CRUD
  const handleSaveRoutine = (routine: Routine) => {
    const index = routines.findIndex(r => r.id === routine.id);
    if (index >= 0) {
      const updated = [...routines];
      updated[index] = routine;
      setRoutines(updated);
    } else {
      setRoutines([...routines, routine]);
    }
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines(routines.filter(r => r.id !== routineId));
  };

  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = userPrefs.theme === 'light' ? 'dark' : 'light';
    const updated: UserPreferences = { ...userPrefs, theme: nextTheme };
    setUserPrefs(updated);
  };

  return (
    <div className="min-h-screen bg-[#F4F3FB] dark:bg-[#0E091C] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Minimal Top Header */}
      <TopBar
        userPrefs={userPrefs}
        selectedDate={selectedDate}
        activeHabitCount={habits.length}
        completedTodayCount={completions.filter(c => c.date === selectedDate && c.status === 'COMPLETED').length}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenUpdateModal={() => setUpdateModalOpen(true)}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Main Active View */}
      <main className="flex-1 w-full overflow-y-auto">
        {activeTab === 'today' && (
          <TodayScreen
            selectedDate={selectedDate}
            habits={habits}
            routines={routines}
            tasks={tasks}
            completions={completions}
            userPrefs={userPrefs}
            onSelectDate={setSelectedDate}
            onToggleHabit={handleToggleHabit}
            onEditHabit={h => {
              setEditingHabit(h);
              setAddEditHabitOpen(true);
            }}
            onEditRoutine={r => {
              setEditingRoutine(r);
              setAddEditRoutineOpen(true);
            }}
            onAddHabit={() => {
              setEditingHabit(null);
              setAddEditHabitOpen(true);
            }}
            onAddRoutine={() => {
              setEditingRoutine(null);
              setAddEditRoutineOpen(true);
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarScreen
            habits={habits}
            routines={routines}
            tasks={tasks}
            completions={completions}
            onToggleHabit={handleToggleHabit}
            onAddHabit={() => {
              setEditingHabit(null);
              setAddEditHabitOpen(true);
            }}
            onEditHabit={h => {
              setEditingHabit(h);
              setAddEditHabitOpen(true);
            }}
          />
        )}

        {activeTab === 'timer' && (
          <TimerScreen
            habits={habits}
            userPrefs={userPrefs}
            onCompleteHabit={id => handleToggleHabit(id, selectedDate)}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsScreen
            habits={habits}
            completions={completions}
            userPrefs={userPrefs}
            onOpenUpdateModal={() => setUpdateModalOpen(true)}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />
        )}
      </main>

      {/* 3. Floating Bottom Navigation Bar */}
      <FloatingBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onQuickAdd={() => setQuickAddModalOpen(true)}
      />

      {/* 4. Modals */}
      <AddEditHabitModal
        isOpen={addEditHabitOpen}
        habit={editingHabit}
        onClose={() => {
          setAddEditHabitOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />

      <AddEditRoutineModal
        isOpen={addEditRoutineOpen}
        routine={editingRoutine}
        habits={habits}
        onClose={() => {
          setAddEditRoutineOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSaveRoutine}
        onDelete={handleDeleteRoutine}
      />

      <QuickAddModal
        isOpen={quickAddModalOpen}
        onClose={() => setQuickAddModalOpen(false)}
        onAddFromTemplate={handleSaveHabit}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        habits={habits}
        tasks={tasks}
        routines={routines}
        goals={goals}
        onSelectHabit={h => {
          setEditingHabit(h);
          setAddEditHabitOpen(true);
        }}
        onSelectTask={t => {
          setEditingTask(t);
          setAddEditTaskOpen(true);
        }}
        onSelectRoutine={r => {
          setEditingRoutine(r);
          setAddEditRoutineOpen(true);
        }}
        onSelectGoal={() => {}}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        userPrefs={userPrefs}
        onSavePreferences={setUserPrefs}
        onDataImported={refreshAllData}
      />

      {/* In-App Direct GitHub OTA Updater Modal */}
      <UpdateModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        targetRepo={userPrefs.githubRepo || 'gianrufin/Tempo-Habit'}
      />
    </div>
  );
};
