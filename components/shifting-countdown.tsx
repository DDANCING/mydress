"use client";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// NOTE: Change this date to whatever date you want to countdown to :)
const COUNTDOWN_FROM = new Date("2025-07-27T23:59:59");

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const ShiftingCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const intervalRef = setInterval(handleCountdown, 1000);

    return () => clearInterval(intervalRef);
  }, []);

  const handleCountdown = () => {
    const end = COUNTDOWN_FROM;
    const now = new Date();
    const distance = +end - +now;

    const days = Math.floor(distance / DAY);
    const hours = Math.floor((distance % DAY) / HOUR);
    const minutes = Math.floor((distance % HOUR) / MINUTE);
    const seconds = Math.floor((distance % MINUTE) / SECOND);

    setTimeLeft({
      days,
      hours,
      minutes,
      seconds,
    });
  };

  return (
 <div className=" bg-black p-20">
    <h1 className="text-4xl text-center text-white font-bold"> Um novo site em breve </h1>
    <div className="mx-auto flex w-full max-w-5xl items-center justify-center bg-black px-4 py-24 text-white">
      <CountdownItem unit="Day" text="days" num={timeLeft.days} />
      <CountdownItem unit="Hour" text="hours" num={timeLeft.hours} />
      <CountdownItem unit="Minute" text="mins" num={timeLeft.minutes} />
      <CountdownItem unit="Second" text="secs" num={timeLeft.seconds} />
    </div>
     </div>  
  );
};

const CountdownItem = ({ num, text, unit }: { num: number; text: string; unit: string }) => {
  return (
    <div className="flex w-1/4 flex-col items-center justify-center gap-1 border-r-[1px] border-slate-200 font-mono md:gap-2">
        
      <div className="relative w-full overflow-hidden text-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={num}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ ease: "backIn", duration: 0.75 }}
            className="block text-2xl font-medium md:text-4xl lg:text-6xl xl:text-7xl"
          >
            {num}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-xs font-light text-slate-400 md:text-sm lg:text-base">
        {text}
      </span>
    </div>
  );
};

export default ShiftingCountdown;
