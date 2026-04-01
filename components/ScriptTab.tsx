'use client';

import { ScriptOutline } from '@/lib/types';

export function ScriptTab({ script }: { script: ScriptOutline }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Hook (0–30s)</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{script.hookBeat}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Evidence Beats</h3>
        <ol className="space-y-2 list-decimal list-inside">
          {script.evidenceBeats.map((beat, i) => (
            <li key={i} className="text-sm text-gray-700 leading-relaxed">{beat}</li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Payoff</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{script.payoffBeat}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Close</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{script.closeBeat}</p>
      </div>
    </div>
  );
}
