export function ChildGamesLogo({ size = 'large' }: { size?: 'large' | 'small' }) {
  if (size === 'small') {
    return (
      <span className="font-display font-bold tracking-widest uppercase text-sm">
        Child<span className="text-mist">/</span>Games
      </span>
    );
  }

  return (
    <div className="select-none text-center leading-[0.85] font-display font-black uppercase animate-fadeUp">
      <div className="text-[14vw] md:text-[8vw] lg:text-[7vw]">Child</div>
      <div className="my-2 h-px w-24 mx-auto bg-line md:w-40" />
      <div className="text-[14vw] md:text-[8vw] lg:text-[7vw] text-mist">Games</div>
    </div>
  );
}
