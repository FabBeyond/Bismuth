import PyramidSchematic from "../components/PyramidSchematic";

export default function Home() {
  return (
    <div className="content">
      <div className="top-part">
        <div className="left-part">
          <p className="page-title">Element 83, now in your Discord.</p>
          <p className="page-subtitle">
            Bismuth is an open-source, 100% free, general purpose Discord bot.
            Built with modules you can enable at your will.
          </p>
        </div>
        <div className="right-part">
          <PyramidSchematic />
        </div>
      </div>
    </div>
  );
}
