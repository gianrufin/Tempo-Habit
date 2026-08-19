import React from 'react';
import {
  Zap,
  Sun,
  Moon,
  Droplets,
  BookOpen,
  Activity,
  Heart,
  Clock,
  Target,
  Coffee,
  Check,
  Flame,
  Bell,
  Smile,
  Music,
  Shield,
  Star,
  Trophy,
  Sparkles,
  Dumbbell,
  Compass,
  Footprints,
  Brain,
  Feather,
  Sunrise,
  Sunset,
  CheckCircle2,
  Calendar,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  moon: Moon,
  droplet: Droplets,
  droplets: Droplets,
  water: Droplets,
  book: BookOpen,
  'book-open': BookOpen,
  reading: BookOpen,
  activity: Activity,
  run: Footprints,
  walk: Footprints,
  fitness: Dumbbell,
  dumbbell: Dumbbell,
  heart: Heart,
  health: Heart,
  clock: Clock,
  time: Clock,
  target: Target,
  goal: Target,
  coffee: Coffee,
  check: Check,
  flame: Flame,
  streak: Flame,
  bell: Bell,
  alarm: Bell,
  smile: Smile,
  mood: Smile,
  music: Music,
  sound: Music,
  shield: Shield,
  star: Star,
  trophy: Trophy,
  sparkles: Sparkles,
  brain: Brain,
  mindfulness: Brain,
  meditation: Feather,
  feather: Feather,
  compass: Compass,
  calendar: Calendar,
};

export const AVAILABLE_ICON_KEYS = [
  'zap',
  'sun',
  'sunrise',
  'sunset',
  'moon',
  'droplet',
  'book-open',
  'activity',
  'fitness',
  'heart',
  'clock',
  'target',
  'coffee',
  'flame',
  'bell',
  'smile',
  'music',
  'star',
  'trophy',
  'sparkles',
  'brain',
  'meditation',
  'compass',
];

interface SquircleIconProps {
  name?: string;
  color?: string; // Hex color or Tailwind color class
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  className?: string;
}

export const SquircleIcon: React.FC<SquircleIconProps> = ({
  name = 'zap',
  color = '#7C69EF',
  size = 'md',
  variant = 'soft',
  className = '',
}) => {
  const cleanKey = (name || 'zap').toLowerCase().trim();
  const IconComponent = ICON_MAP[cleanKey] || Zap;

  const sizeClasses = {
    xs: { box: 'w-6 h-6 rounded-lg', icon: 'w-3.5 h-3.5' },
    sm: { box: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4' },
    md: { box: 'w-10 h-10 rounded-2xl', icon: 'w-5 h-5' },
    lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
    xl: { box: 'w-14 h-14 rounded-3xl', icon: 'w-7 h-7' },
  }[size];

  // If color is a hex
  const isHex = color.startsWith('#');

  if (variant === 'soft') {
    return (
      <div
        className={`${sizeClasses.box} flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 ${className}`}
        style={{
          backgroundColor: isHex ? `${color}18` : undefined,
          color: isHex ? color : undefined,
        }}
      >
        <IconComponent className={sizeClasses.icon} strokeWidth={2.2} />
      </div>
    );
  }

  if (variant === 'solid') {
    return (
      <div
        className={`${sizeClasses.box} flex items-center justify-center shrink-0 shadow-sm text-white ${className}`}
        style={{
          backgroundColor: isHex ? color : undefined,
        }}
      >
        <IconComponent className={sizeClasses.icon} strokeWidth={2.2} />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses.box} flex items-center justify-center shrink-0 border ${className}`}
      style={{
        borderColor: isHex ? `${color}40` : undefined,
        color: isHex ? color : undefined,
      }}
    >
      <IconComponent className={sizeClasses.icon} strokeWidth={2.2} />
    </div>
  );
};
