'use client';

import { ProductionBrief } from '@/lib/types';
import { InstructionBlock } from './InstructionBlock';

interface BriefSectionProps {
  brief: ProductionBrief;
  onCopy: (text: string) => void;
}

export function BriefSection({ brief, onCopy }: BriefSectionProps) {
  const copySection = (label: string, text: string) => {
    onCopy(`${label}\n\n${text}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Hook Strategy</h3>
          <button
            onClick={() => copySection('Hook Strategy', brief.hookStrategy.instruction)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Copy
          </button>
        </div>
        <InstructionBlock instruction={brief.hookStrategy} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Content Structure</h3>
          <button
            onClick={() => copySection('Content Structure', brief.contentStructure.instruction)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Copy
          </button>
        </div>
        <InstructionBlock instruction={brief.contentStructure} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Priority Triggers</h3>
          <button
            onClick={() =>
              copySection(
                'Priority Triggers',
                brief.priorityTriggers.map((t, i) => `${i + 1}. ${t.instruction}`).join('\n\n')
              )
            }
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Copy
          </button>
        </div>
        <div className="space-y-3">
          {brief.priorityTriggers.map((trigger, i) => (
            <InstructionBlock key={i} instruction={trigger} label={`Trigger ${i + 1}`} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">What to Avoid</h3>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900 leading-relaxed">{brief.avoidanceNotes}</p>
        </div>
      </div>
    </div>
  );
}
