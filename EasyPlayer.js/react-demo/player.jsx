// 创建 Player 组件
function Player() {
  const myRef = React.useRef(null); // 用于引用 DOM 元素
  const easyPro = React.useRef(null); // 存储播放器实例

  // 视频流地址
  const [url, setUrl] = React.useState(
    "http://<HOST>:<PORT>/live/<STREAM>.flv?token=<TOKEN>&expired=<YYYYMMDDhhmmss>"
  );

  // 配置项
  const config = {
    isLive: true,
    bufferTime: 0.2,
    stretch: false,
    MSE: true,
    WCS: true,
    hasAudio: true,
  };

  // 在组件挂载后创建播放器实例
  React.useEffect(() => {
    if (easyPro.current) {
      easyPro.current.destroy().then(() => {
        create();
      });
    } else {
      create();
    }
  }, [url]);

  // 创建播放器实例
  const create = () => {
    easyPro.current = new window.EasyPlayerPro(myRef.current, {
      isLive: config.isLive,
      bufferTime: config.bufferTime,
      stretch: config.stretch,
      MSE: config.MSE,
      WCS: config.WCS,
      hasAudio: config.hasAudio,
      watermark: { text: { content: "easyplayer-pro" }, right: 10, top: 10 },
    });
    play();
  };

  // 播放视频
  const play = () => {
    if (!easyPro.current) return create();
    easyPro.current
      .play(url)
      .then(() => {
        console.log("player started");
      })
      .catch((e) => {
        console.error("error", e);
      });
  };

  return (
    <div>
      <div
        style={{ width: "640px", height: "360px", backgroundColor: "#000000" }}
        ref={myRef}
      ></div>
      <input
        style={{ width: "640px", marginTop: "10px" }}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      ></input>
    </div>
  );
}

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
console.log("root", root);

root.render(<Player />);
