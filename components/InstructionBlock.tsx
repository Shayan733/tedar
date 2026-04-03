'use client';

import { Badge } from '@/components/ui/badge';
import { BuilderInstruction } from '@/lib/types';

const domainLabels: Record<string, string> = {
  cognitive_psychology: 'Cognitive Psychology',
  emotion_science: 'Emotion Science',
  social_behavioural: 'Social Behavioural',
  visual_psychology: 'Visual Psychology',
  audio_music: 'Audio & Music',
  performance_direction: 'Performance Direction',
  production_craft: 'Production Craft',
};

const domainColours: Record<string, string> = {
  cognitive_psychology: 'bg-blue-100 text-blue-800',
  emotion_science: 'bg-purple-100 text-purple-800',
  social_behavioural: 'bg-green-100 text-green-800',
};

const confidenceColours: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600',
};

interface InstructionBlockProps {
  instruction: BuilderInstruction;
  label?: string;
}

export function InstructionBlock({ instruction, label }: InstructionBlockProps) {
  const domainClass = domainColours[instruction.domain] ?? 'bg-gray-100 text-gray-600';
  const confClass = confidenceColours[instruction.confidence] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      {label && <h4 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</h4>}
      <p className="text-sm leading-relaxed text-gray-900">{instruction.instruction}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className={domainClass}>{domainLabels[instruction.domain] ?? instruction.domain}</Badge>
        <Badge className={confClass}>{instruction.confidence}</Badge>
      </div>
      <p className="mt-3 text-xs italic text-gray-500 leading-relaxed">{instruction.reason}</p>
    </div>
  );
}
