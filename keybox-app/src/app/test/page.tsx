"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("🧪 TEST PAGE: useEffect triggered");
    console.error("🚨 TEST PAGE: This should be visible in console");
    setMounted(true);
  }, []);

  console.log("🧪 TEST PAGE: Component rendering, mounted:", mounted);
  console.error("🚨 TEST PAGE: Component render log");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>Client-side mounted: {mounted ? "✅ Yes" : "❌ No"}</p>
      <p>Current time: {new Date().toISOString()}</p>
      <button 
        onClick={() => {
          console.log("🧪 TEST PAGE: Button clicked");
          console.error("🚨 TEST PAGE: Button click event");
          alert("Button clicked!");
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Test Button
      </button>
    </div>
  );
}
