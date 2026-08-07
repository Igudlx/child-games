import { RobotGraphic } from "./RobotGraphic";

export function ChildGamesWordmark() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-10 px-6">
      <RobotGraphic className="w-24 h-28 opacity-80 animate-float" />
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fade-up">
        <span className="font-display font-black text-white text-5xl sm:text-6xl md:text-8xl tracking-wider">
          Child
        </span>
        <span className="hidden md:block h-[2px] w-24 glow-line" />
        <span className="block md:hidden w-24 h-[2px] glow-line" />
        <span className="font-display font-black text-white text-5xl sm:text-6xl md:text-8xl tracking-wider">
          Games
        </span>
      </div>
      <p className="text-ghost text-sm uppercase tracking-[0.3em] animate-fade-up">
        Select a game to get started
      </p>
    </div>
  );
}
