"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function SandboxPage() {
  const [show, setShow] = useState(true);

  return (
    <div className="mt-20 flex h-screen max-h-screen w-full flex-col items-center justify-start">
      <div className="flex flex-col items-center p-0 pb-[50px]">
        <motion.button
          className="rounded-[10px] bg-black p-4 text-white"
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShow(!show);
          }}
        >
          {show ? "Hide" : "Show"}
        </motion.button>
      </div>

      {/* {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="m-0 flex h-[150px] w-[150px] items-center justify-center rounded-[30px] bg-black text-white"
        />
      ) : null} */}

      {/* <AnimatePresence>
        {show ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="m-0 flex h-[150px] w-[150px] items-center justify-center rounded-[30px] bg-black text-white"
          />
        ) : null}
      </AnimatePresence> */}

      <AnimatePresence>
        {show ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} // 定义退出动画
            className="m-0 flex h-[150px] w-[150px] items-center justify-center rounded-[30px] bg-black text-white"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
