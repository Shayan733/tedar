'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BuilderResult } from '@/lib/types';
import { BriefSection } from './BriefSection';
import { ScriptSection } from './ScriptSection';

interface BuilderCardProps {
  result: BuilderResult;
}

export function BuilderCard({ result }: BuilderCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore if clipboard not available
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Production Direction Brief</h2>
          {copied && (
            <span className="text-xs text-emerald-600">Copied to clipboard</span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Built for {result.creatorContext.channelName} in {result.creatorContext.niche}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="brief">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="brief">Brief</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
          </TabsList>

          <TabsContent value="brief">
            <BriefSection brief={result.productionBrief} onCopy={handleCopy} />
          </TabsContent>

          <TabsContent value="script">
            <ScriptSection script={result.scriptOutline} onCopy={handleCopy} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
