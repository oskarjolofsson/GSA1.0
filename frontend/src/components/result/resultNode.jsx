import "../../styles/comp1.css"

export default function TextPage() {
  const [health, setHealth] = useState(null);
  // Methods for extracting data from backend

  // Check health, return nothing
  async function getHealth() {
    // If it works, fetching from port 8000 will work
    try {
      const res = fetch()
    }
    // Something went wrong, 8000 probably not working
    catch {

    }
  }

  getHealth();

  return (
    <div className="page-wrap">
      <div className="frame">
        <section className="surface">
          <div className="text-content">
            
          </div>
        </section>
      </div>
    </div>
  );
}