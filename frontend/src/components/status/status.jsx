import TextBox from "../textBox/textBox.jsx";
import { useState, useEffect } from "react";

export default function Status() {
    const [status, setStatus] = useState("Checking...");

    // Function to check if the backend is responding
    async function checkBackendStatus() {
    try {
      const res = await fetch("http://localhost:8000/upload", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json(); // ← extract JSON

      setStatus("Online ✅: " + data.message || "")
    } catch (err) {
      setStatus("Offline: Backend could not be reached");
    }
  }

    useEffect(() => {
        checkBackendStatus();
    }, []);

    return (
        <>
            <TextBox header={"Status:"} text={status} />
        </>
    );
}