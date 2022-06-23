import { useEffect, useRef } from "react";
import Hls from "hls.js";

export const MistPlayer = ({ ethAddress }) => {
  const videoRef = useRef(null);
  const src = `https://playback.livepeer.name/hls/stream+${String(
    ethAddress
  ).toLowerCase()}/index.m3u8`;

  useEffect(() => {
    let hls;
    if (videoRef.current) {
      const video = videoRef.current;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Some browers (safari and ie edge) support HLS natively
        video.src = src;
      } else if (Hls.isSupported()) {
        // This will run in all other modern browsers
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        console.error("This is a legacy browser that doesn't support MSE");
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoRef, src]);

  return (
    <video
      controls
      ref={videoRef}
      style={{ width: "100%" }}
    />
  );
};
