import React from "react";
import {
  Code,
  BookOpen,
  Dumbbell,
  Target,
  Flame,
  Compass,
  Palette,
  Music,
  Briefcase,
  Sparkles,
  Coffee,
  Bike,
  Terminal,
  Brain,
  Zap,
  Heart,
  Clock,
  CheckCircle2,
  PenTool,
  Globe,
  Activity,
  LucideIcon,
} from "lucide-react";

export const AVAILABLE_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "target", label: "Target", icon: Target },
  { id: "code", label: "Coding", icon: Code },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "book", label: "Reading", icon: BookOpen },
  { id: "dumbbell", label: "Fitness", icon: Dumbbell },
  { id: "bike", label: "Cycling", icon: Bike },
  { id: "brain", label: "Study / Focus", icon: Brain },
  { id: "zap", label: "Energy", icon: Zap },
  { id: "flame", label: "Habit Streak", icon: Flame },
  { id: "heart", label: "Health", icon: Heart },
  { id: "coffee", label: "Break / Routine", icon: Coffee },
  { id: "briefcase", label: "Work", icon: Briefcase },
  { id: "pen", label: "Writing", icon: PenTool },
  { id: "palette", label: "Design", icon: Palette },
  { id: "music", label: "Music", icon: Music },
  { id: "compass", label: "Explore", icon: Compass },
  { id: "globe", label: "Language", icon: Globe },
  { id: "clock", label: "Time Tracking", icon: Clock },
  { id: "sparkles", label: "Creativity", icon: Sparkles },
  { id: "check", label: "Task", icon: CheckCircle2 },
];

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  code: Code,
  terminal: Terminal,
  book: BookOpen,
  dumbbell: Dumbbell,
  bike: Bike,
  brain: Brain,
  zap: Zap,
  flame: Flame,
  heart: Heart,
  coffee: Coffee,
  briefcase: Briefcase,
  pen: PenTool,
  palette: Palette,
  music: Music,
  compass: Compass,
  globe: Globe,
  clock: Clock,
  sparkles: Sparkles,
  check: CheckCircle2,
};

interface TaskIconProps {
  name: string | null | undefined;
  className?: string;
  fallback?: LucideIcon;
}

export default function TaskIcon({
  name,
  className = "w-4 h-4",
  fallback = Activity,
}: TaskIconProps) {
  if (!name) {
    const FallbackComponent = fallback;
    return <FallbackComponent className={className} />;
  }

  // If name matches one of our clean keys
  const IconComponent = iconMap[name.toLowerCase().trim()];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback icon
  const FallbackComponent = fallback;
  return <FallbackComponent className={className} />;
}
