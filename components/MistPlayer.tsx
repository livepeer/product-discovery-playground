import { useEffect } from "react";

export const MistPlayer = ({ proof, index }) => {
  useEffect(() => {
    setTimeout(() => {
      var a = function () {
        window.mistPlay("5208b31slogl2gw4", {
          target: document.getElementById("mistvideo"),
          urlappend: `?proof=${proof}`,
          // forcePlayer: "hlsjs",
          // forceType: "html5/application/vnd.apple.mpegurl",
          // forcePriority: {
          //   source: [["type", ["html5/application/vnd.apple.mpegurl"]]],
          // },
        });
      };
      if (!window.mistplayers) {
        var p = document.createElement("script");
        p.src = "https://playback.livepeer.engineering/player.js";
        document.head.appendChild(p);
        p.onload = a;
      } else {
        a();
      }
    });
  }, [proof]);

  return <div className="mistvideo" id="mistvideo" />;
};
