"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <span>{format(time, "HH:mm:ss")}</span>;
}
