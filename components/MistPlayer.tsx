import { useEffect } from "react";

export const MistPlayer = ({ ethAddress }) => {
  useEffect(() => {
    setTimeout(() => {
      var a = function () {
        (window as any).mistPlay(ethAddress, {
          target: document.getElementById("mistvideo"),
          // urlappend: `?proof=${proof}`,
          // forcePlayer: "hlsjs",
          // forceType: "html5/application/vnd.apple.mpegurl",
          // forcePriority: {
          //   source: [["type", ["html5/application/vnd.apple.mpegurl"]]],
          // },
        });
      };
      if (!(window as any).mistplayers) {
        var p = document.createElement("script");
        p.src = "https://playback.livepeer.name/player.js";
        document.head.appendChild(p);
        p.onload = a;
      } else {
        a();
      }
    });
  }, [ethAddress]);

  return <div className="mistvideo" id="mistvideo" />;
};
