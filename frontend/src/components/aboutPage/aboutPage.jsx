import "../../styles/comp1.css"

export default function TextPage() {
  return (
    <div className="page-wrap">
      <div className="frame">
        <section className="surface">
          <div className="text-content">
            <h1 className="big-header">Some header</h1>
            <h2 className="small-header">Our Mission</h2>
            <p className="normal-text">

              lalalalallalalalalalalalal this comes later
            </p>
            <h2 className="small-header">Our Vision</h2>
            <p className="normal-text">
              this sounds important but probably is not
            </p>
            <h2 className="small-header">Our Values</h2>
            <p className="normal-text">
              To be the best I guess
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}