'use client';

import { ReplicationBrief } from '@/lib/types';

export function BriefTab({ brief }: { brief: ReplicationBrief }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Hook Strategy</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{brief.hookStrategy}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Content Structure</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{brief.contentStructure}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Priority Triggers</h3>
        <ol className="space-y-1 list-decimal list-inside">
          {brief.priorityTriggers.map((t, i) => (
            <li key={i} className="text-sm text-gray-700">{t}</li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What to Avoid</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{brief.avoidanceNotes}</p>
      </div>
    </div>
  );
}
