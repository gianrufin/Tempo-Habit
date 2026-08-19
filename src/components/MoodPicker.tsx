import React, { useState } from 'react';
import { MoodRecord, MoodValue } from '../types';
import { Sparkles, MessageSquare } from 'lucide-react';

interface MoodPickerProps {
  selectedDate: string; // YYYY-MM-DD
  currentMood?: MoodRecord;
  onSaveMood: (mood: MoodValue, note?: string) => void;
}

const MOODS: { value: MoodValue; emoji: string; label: string; color: string }[] = [
  { value: 1, emoji: '😞', label: 'Awful', color: '#EF4444' },
  { value: 2, emoji: '😕', label: 'Low', color: '#F97316' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#EAB308' },
  { value: 4, emoji: '🙂', label: 'Good', color: '#10B981' },
  { value: 5, emoji: '😄', label: 'Great', color: '#8B5CF6' },
];

export const MoodPicker: React.FC<MoodPickerProps> = ({
  selectedDate,
  currentMood,
  onSaveMood,
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState(currentMood?.note || '');

  const handleSelectMood = (val: MoodValue) => {
    onSaveMood(val, note.trim() || undefined);
  };

  const handleSaveNote = () => {
    if (currentMood) {
      onSaveMood(currentMood.mood, note.trim() || undefined);
      setShowNoteInput(false);
    }
  };

  const activeMoodObj = MOODS.find(m => m.value === currentMood?.mood);

  return (
    <div className="mx-4 sm:mx-6 my-2 p-4 bg-[#140e24] border border-purple-500/15 rounded-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">
            Daily Mindset Check-in
          </span>
        </div>
        {activeMoodObj && (
          <span className="text-xs font-medium text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
            Feeling {activeMoodObj.label}
          </span>
        )}
      </div>

      {/* Mood Emoji buttons */}
      <div className="grid grid-cols-5 gap-2">
        {MOODS.map(m => {
          const isSelected = currentMood?.mood === m.value;
          return (
            <button
              key={m.value}
              id={`mood-btn-${m.value}`}
              onClick={() => handleSelectMood(m.value)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all ${
                isSelected
                  ? 'bg-gradient-to-t from-purple-900/60 to-purple-800/40 border border-amber-400/50 shadow-md shadow-purple-950 scale-105'
                  : 'bg-[#1b1330] hover:bg-[#241a40] text-zinc-400 border border-white/5'
              }`}
            >
              <span className="text-2xl sm:text-3xl mb-1 filter drop-shadow-sm">{m.emoji}</span>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-amber-200 font-semibold' : 'text-zinc-400'}`}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Optional Note toggle */}
      {currentMood && (
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
          {!showNoteInput && !currentMood.note ? (
            <button
              onClick={() => setShowNoteInput(true)}
              className="text-xs text-zinc-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors self-start"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Add a quick reflection note...
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What made you feel this way?"
                className="flex-1 px-3 py-1.5 text-xs bg-[#0e081c] border border-purple-500/20 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400/50"
              />
              <button
                onClick={handleSaveNote}
                className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
