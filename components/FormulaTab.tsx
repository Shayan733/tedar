'use client';

import { Badge } from '@/components/ui/badge';
import { PsychologicalFormula } from '@/lib/types';

export function FormulaTab({ formula }: { formula: PsychologicalFormula }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{formula.primaryMechanism}</h2>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{formula.mechanismDescription}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Supporting Mechanisms</h3>
        <ul className="space-y-1">
          {formula.supportingMechanisms.map((m, i) => (
            <li key={i} className="text-sm text-gray-700">• {m}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Interaction Effects</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{formula.interactionEffects}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Key Moments</h3>
        <div className="space-y-4">
          {formula.keyMoments.map((moment, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">{moment.timestamp}</Badge>
                <span className="text-xs font-semibold text-gray-800">{moment.mechanism}</span>
              </div>
              <p className="text-sm italic text-gray-600">&ldquo;{moment.transcriptQuote}&rdquo;</p>
              <div className="flex flex-wrap gap-1">
                {moment.dimensionsActivated.map((d, j) => (
                  <Badge key={j} variant="secondary" className="text-xs">{d}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
