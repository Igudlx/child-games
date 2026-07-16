export function LinkingAnimation({ done = false }: { done?: boolean }) {
  if (done) {
    return (
      <p className="font-display text-xl tracking-widest uppercase text-paper animate-fadeUp">
        Linked <span aria-hidden="true">✓</span>
      </p>
    );
  }

  return (
    <p className="font-display text-xl tracking-widest uppercase animate-pulseFade">
      Linking…
    </p>
  );
}
