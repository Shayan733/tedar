'use client';

import { BuilderScriptOutline } from '@/lib/types';
import { InstructionBlock } from './InstructionBlock';

interface ScriptSectionProps {
  script: BuilderScriptOutline;
  onCopy: (text: string) => void;
}

export function ScriptSection({ script, onCopy }: ScriptSectionProps) {
  const copyAll = () => {
    const parts = [
      `HOOK (0-30s)\n${script.hookBeat.instruction}`,
      ...script.evidenceBeats.map(
        (b, i) => `BEAT ${i + 1}\n${b.instruction}`
      ),
      `PAYOFF\n${script.payoffBeat.instruction}`,
      `CLOSE\n${script.closeBeat.instruction}`,
    ];
    onCopy(parts.join('\n\n---\n\n'));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={copyAll}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Copy Full Script
        </button>
      </div>

      <InstructionBlock instruction={script.hookBeat} label="Hook (0-30s)" />

      <div>
        <h3 className="text-lg font-semibold mb-3">Evidence Beats</h3>
        <div className="space-y-3">
          {script.evidenceBeats.map((beat, i) => (
            <InstructionBlock key={i} instruction={beat} label={`Beat ${i + 1}`} />
          ))}
        </div>
      </div>

      <InstructionBlock instruction={script.payoffBeat} label="Payoff" />

      <InstructionBlock instruction={script.closeBeat} label="Close" />
    </div>
  );
}
