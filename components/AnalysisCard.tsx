'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { DecoderResult, VideoData } from '@/lib/types';
import { FormulaTab } from './FormulaTab';
import { ScoresTab } from './ScoresTab';
import { BriefTab } from './BriefTab';
import { ScriptTab } from './ScriptTab';

interface AnalysisCardProps {
  result: DecoderResult;
  videoData: VideoData;
}

export function AnalysisCard({ result }: AnalysisCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <Tabs defaultValue="formula">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="formula">Formula</TabsTrigger>
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="brief">Brief</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
          </TabsList>

          <TabsContent value="formula">
            <FormulaTab formula={result.psychologicalFormula} />
          </TabsContent>

          <TabsContent value="scores">
            <ScoresTab score={result.engagementScore} />
          </TabsContent>

          <TabsContent value="brief">
            <BriefTab brief={result.replicationBrief} />
          </TabsContent>

          <TabsContent value="script">
            <ScriptTab script={result.scriptOutline} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
