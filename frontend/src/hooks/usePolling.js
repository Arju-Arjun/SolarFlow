import { useEffect } from "react";

export default function usePolling(callback, interval = 10000) {
  useEffect(() => {
    callback();

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        callback();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [callback, interval]);
}