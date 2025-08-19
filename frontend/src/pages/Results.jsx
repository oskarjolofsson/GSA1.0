import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Results() {
  const { jobId } = useParams();
  const [status, setStatus] = useState("waiting");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/results/${jobId}`);
        const data = await res.json();

        if (data.status === "done") {
          setResult(data);
          setStatus("done");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
      }
    }, 3000); // poll every 3s

    return () => clearInterval(interval);
  }, [jobId]);

  if (status === "waiting") {
    return <p>Processing your video… please wait ⏳</p>;
  }

  return (
    <div>
      <h2>Results</h2>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}