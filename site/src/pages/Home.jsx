import PyramidSchematic from "../components/PyramidSchematic";

export default function Home() {
  return (
    <div className="content">
      <div className="hero">
        <div className="hero-text">
          <h1 className="page-title">Element 83, now in your Discord.</h1>
          <p className="page-subtitle">
            Bismuth is an open-source, 100% free, general purpose Discord bot.
            Built with modules you can enable at your will.
          </p>
        </div>
        <div>
          <PyramidSchematic />
        </div>
      </div>
    </div>
  );
}
