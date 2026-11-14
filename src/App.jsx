import "./index.css";
import pyramid from "./assets/MainPagePyramid.svg";
import bismuthLogo from "./assets/BismuthLogo.svg";

function App() {
  return (
    <div className="main">
      <div className="nav-bar">
        <div className="nav-left">
          <img src={bismuthLogo} alt="bismuth logo" />
          <p className="title">BISMUTH</p>
        </div>
        <div className="nav-right">
          <a href="https://github.com/FabBeyond/bismuthbot">BOT SOURCE</a>
          <a href="https://github.com/FabBeyond/bismuthsite">SITE SOURCE</a>
          <a href="hwef" className="login-button">
            LOG IN WITH DISCORD
          </a>
        </div>
      </div>
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
            <img src={pyramid} alt="pyramid" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
