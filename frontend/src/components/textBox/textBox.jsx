import "./textBox.css"

export default function TextBox({ header, text }) {
  return (
    <div className="page-wrap">
      <div className="frame">
        <section className="surface">
          <div className="text-content">
            <h1 className="big-header">{ header }</h1>
            <h2 className="small-header">{ text }</h2>
          </div>
        </section>
      </div>
    </div>
  );
}