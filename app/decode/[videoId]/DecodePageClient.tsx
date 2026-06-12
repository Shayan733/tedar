'use client';

import { useCallback, useState } from 'react';
import { DecodeLoader } from './DecodeLoader';
import { BriefBuilder } from './BriefBuilder';
import { AudienceDecoder } from './AudienceDecoder';

interface DecodePageClientProps {
  youtubeVideoId: string;
  videoUrl: string;
}

interface PreparedInfo {
  videoId: string;                    // Supabase UUID
  existingAudienceId: string | null;
}

export function DecodePageClient({ youtubeVideoId, videoUrl }: DecodePageClientProps) {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [preparedInfo, setPreparedInfo] = useState<PreparedInfo | null>(null);

  // Stable identity — DecodeLoader's prepare effect depends on this callback
  const handlePrepared = useCallback((videoId: string, existingAudienceId: string | null) => {
    setPreparedInfo({ videoId, existingAudienceId });
  }, []);

  return (
    <>
      <DecodeLoader
        youtubeVideoId={youtubeVideoId}
        videoUrl={videoUrl}
        onAnalysisComplete={(id) => setAnalysisId(id)}
        onPrepared={handlePrepared}
      />
      {preparedInfo && (
        <>
          <hr className="border-gray-200" />
          <AudienceDecoder
            videoId={preparedInfo.videoId}
            existingAudienceId={preparedInfo.existingAudienceId}
          />
        </>
      )}
      {analysisId && (
        <>
          <hr className="border-gray-200" />
          <BriefBuilder analysisId={analysisId} />
        </>
      )}
    </>
  );
}
