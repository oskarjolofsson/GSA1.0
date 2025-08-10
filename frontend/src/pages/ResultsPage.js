import { useLocation, Link } from 'react-router-dom';
import { useMemo } from 'react';

export default function ResultsPage() {
  const location = useLocation();
  const results = location.state?.results || null;

  const pretty = useMemo(() => {
    try {
      // If backend returns an object with .output_text JSON string, parse it;
      // otherwise just pretty-print the results object directly.
      if (!results) return null;
      if (results.output_text) {
        return JSON.stringify(JSON.parse(results.output_text), null, 2);
      }
      return JSON.stringify(results, null, 2);
    } catch (e) {
      return JSON.stringify(results, null, 2);
    }
  }, [results]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Analysis Results</h2>
      {!results ? (
        <div>
          <p>No results to display. Please upload a video first.</p>
          <Link to="/upload">Go to Upload</Link>
        </div>
      ) : (
        <>
          <pre style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '1rem',
            borderRadius: '8px',
            overflowX: 'auto'
          }}>{pretty}</pre>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/upload">Analyze another video</Link>
          </div>
        </>
      )}
    </div>
  );
}

