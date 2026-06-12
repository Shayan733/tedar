// TEDAR — Homepage hero
// The portfolio pitch: what problem this solves for media professionals.

const STEPS = [
  {
    step: '1 · Scout',
    title: 'Find the outliers',
    text: 'Type a niche, channel, or video. TEDAR scans up to 100 videos per channel and flags the ones performing 3x+ above the channel baseline — the videos worth studying.',
  },
  {
    step: '2 · Decode',
    title: 'Understand why they won',
    text: 'The K1 Decoder reads the transcript and names the psychological mechanisms — Kahneman, Berger, Loewenstein — while the Audience Decoder reads the top comments to reveal what viewers actually felt.',
  },
  {
    step: '3 · Build',
    title: 'Turn it into your playbook',
    text: 'The Builder translates the analysis into a production brief and script outline calibrated to your channel — concrete instructions, not vague tips.',
  },
];

export function HomeHero() {
  return (
    <div className="space-y-10">
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Decode why videos win.
        </h1>
        <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          Every creator can see <em>that</em> a video outperformed. TEDAR shows you{' '}
          <em>why</em> — the psychology in the script, the reaction in the comments —
          and turns it into a brief you can shoot.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map((item) => (
          <div key={item.step} className="rounded-lg border border-gray-200 p-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">{item.step}</p>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
