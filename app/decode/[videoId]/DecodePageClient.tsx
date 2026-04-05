'use client';

import { useState } from 'react';
import { DecodeLoader } from './DecodeLoader';
import { BriefBuilder } from './BriefBuilder';

interface DecodePageClientProps {
  youtubeVideoId: string;
  videoUrl: string;
}

export function DecodePageClient({ youtubeVideoId, videoUrl }: DecodePageClientProps) {
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  return (
    <>
      <DecodeLoader
        youtubeVideoId={youtubeVideoId}
        videoUrl={videoUrl}
        onAnalysisComplete={(id) => setAnalysisId(id)}
      />
      {analysisId && (
        <>
          <hr className="border-gray-200" />
          <BriefBuilder analysisId={analysisId} />
        </>
      )}
    </>
  );
}
