export default function AboutUsPage() {
  return (
    <main className="pt-[96px] min-h-screen">
      {/* Hero */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16 border-b border-brand-border">
        <p className="section-label mb-3">Who We Are</p>
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-brand-dark max-w-3xl leading-tight">
          About CURATED.
        </h1>
      </div>

      {/* Mission */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 border-b border-brand-border">
        <div>
          <p className="section-label mb-4">Our Mission</p>
          <h2 className="font-serif text-3xl font-light text-brand-dark mb-6 leading-snug">
            Premium commerce for the contemporary individual.
          </h2>
          <p className="text-sm text-brand-muted leading-relaxed mb-4">
            CURATED was founded on a single belief: that the things we own should be worth owning. In a world of disposable fashion and mass production, we exist to offer an alternative — considered, lasting, and deeply intentional.
          </p>
          <p className="text-sm text-brand-muted leading-relaxed">
            Every piece in our selection is evaluated on the merits of its craft, its material honesty, and its ability to endure beyond the season. We work directly with artisans, independent designers, and heritage manufacturers who share this philosophy.
          </p>
        </div>
        <div className="bg-brand-border/20 aspect-[4/3] flex items-center justify-center">
          <p className="font-serif text-4xl text-brand-border tracking-widest">CURATED</p>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16 border-b border-brand-border">
        <p className="section-label mb-8">Our Values</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              title: 'Craft First',
              body: 'We prioritise products made with skill and integrity. From selvedge denim woven on antique looms to hand-stitched leather goods from Florentine workshops, craft is our compass.',
            },
            {
              title: 'Considered Selection',
              body: 'Our edit is deliberately small. Every product earns its place through rigorous evaluation. We would rather offer you twelve exceptional pieces than twelve hundred mediocre ones.',
            },
            {
              title: 'Timeless Utility',
              body: 'We believe in objects that age gracefully. We avoid trenddriven items in favour of pieces that will be valued five, ten, or twenty years from now.',
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h3 className="font-serif text-xl font-light text-brand-dark mb-3">{title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16">
        <p className="section-label mb-8">The Collective</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { name: 'Isla Margaux', role: 'Founder & Creative Director' },
            { name: 'Thomas Vance', role: 'Head of Buying' },
            { name: 'Céline Aubert', role: 'Editorial Director' },
            { name: 'Ravi Menon', role: 'Head of Operations' },
          ].map(({ name, role }) => (
            <div key={name}>
              <div className="aspect-square bg-brand-border/20 mb-4" />
              <p className="text-sm font-medium text-brand-dark">{name}</p>
              <p className="text-xs text-brand-muted mt-0.5">{role}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
