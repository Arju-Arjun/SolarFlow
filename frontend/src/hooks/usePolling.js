import { useEffect, useRef } from "react";

const usePolling = ({ callback, delay = 10000, pause = false, immediate = false }) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (pause || typeof savedCallback.current !== "function") {
      return undefined;
    }

    if (immediate) {
      savedCallback.current();
    }

    const interval = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearInterval(interval);
    };
  }, [delay, pause, immediate]);
};

export default usePolling;
