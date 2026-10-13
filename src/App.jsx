import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import logo from "./assets/logo.png";
import "./App.css";

const FUNCTIONS = ["Engagement", "Haldi", "Mehndi", "Lagan", "Wedding", "Reception"];
const DELIVERABLES = [
  "Traditional Video", "Traditional Photo", "Cinematography", "Candid Photography",
  "40 Sheet Album for All Rituals", "10 Sheets Album for Bride & Groom Portraits",
  "Drone Shoots", "Full HD Video with Pendrive", "Pendrive Box", "Album Leather Bag",
  "Wedding Teaser / Highlight", "Wedding Reels", "Wedding Invitations", "20x30 Photo Frame",
  "12x18 Photo Only", "L.E.D Frame for Entrance (Photos after wedding)", "All Raw Data",
  "Extra Reel Maker", "Cloud Based Data (6 Month Validity)", "Instagram Post & Wedding Countdowns",
];
const TERMS = `A booking advance of 10% of the total amount must be paid at the time of confirming and booking the program.
An additional 80% of the amount must be paid 2 days prior to the wedding date.
The final 10% balance must be paid at the time of delivering all raw data/footage.
The Haldi function coverage is allotted for a duration of 2 hours (12:00 PM to 4:00 PM). If the Haldi function starts or extends beyond 4:00 PM, additional hourly or separate charges will apply.
If the Mehendi function takes place on a separate day, additional service charges will be applicable.
All wedding data and media must be collected within 3 months from the date of the wedding. The studio will not be responsible for any data loss or deletion after the 3-month period.
It will take approximately 20 days to prepare the complete data after photo selection is finalized. During peak wedding seasons, processing times may be extended.
Clients are required to provide a dedicated Pen Drive (128 GB or 256 GB, depending on the volume of data) at the time of booking to securely handover all Raw Data as a backup against accidental loss. The pen drive cost is separate from the package.
Travel included in this package.`;

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => (d ? d.split("-").reverse().join("/") : "");

/* ---------- Chip picker with custom add ---------- */
function Picker({ title, options, setOptions, selected, setSelected }) {
  const [custom, setCustom] = useState("");
  const toggle = (o) =>
    setSelected(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  const add = () => {
    const v = custom.trim();
    if (!v) return;
    if (!options.includes(v)) setOptions([...options, v]);
    if (!selected.includes(v)) setSelected([...selected, v]);
    setCustom("");
  };
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="chips">
        {options.map((o) => (
          <button type="button" key={o} className={selected.includes(o) ? "chip on" : "chip"} onClick={() => toggle(o)}>
            {selected.includes(o) ? "✓ " : ""}{o}
          </button>
        ))}
      </div>
      <div className="row">
        <input value={custom} placeholder="Add custom option" onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <button type="button" className="btn" onClick={add}>Add</button>
      </div>
    </fieldset>
  );
}

/* ---------- The printable A4 bill ---------- */
function Bill({ d, funcs, dels, balance, innerRef }) {
  return (
    <div id="bill" ref={innerRef} className="bill">
      <div className="b-head">
        <img src={logo} alt="Ram Photography" className="b-logo" />
        <div className="b-right">
          <div className="b-title">BOOKING / RECEIPT</div>
          <p><b>No:</b> {d.no}</p>
          <p><b>Date:</b> {[fmt(d.bookDate), fmt(d.eventDate)].filter(Boolean).join(", ")}</p>
          <p>Ph: 9012663748</p>
          <p>ramphotography90@gmail.com</p>
          <p>Ramkishor901266@gmail.com</p>
          <p><b>Address:</b> Awashvikas Ushava Road Budaun 243601</p>
        </div>
      </div>
      <div className="b-line" />

      <div className="b-h">CLIENT DETAILS</div>
      <p className="b-f"><b>Name:</b> {d.name}<span className="gap" /><b>Contact No:</b> {d.phone}</p>
      <p className="b-f"><b>Address:</b> {d.address}</p>

      {funcs.length > 0 && (
        <>
          <div className="b-h">CLIENT FUNCTION DETAILS</div>
          <div className="b-grid3">{funcs.map((f) => <span key={f}>☑ {f}</span>)}</div>
        </>
      )}

      {dels.length > 0 && (
        <div className="b-box">
          <div className="b-boxt">CLIENT DELIVERABLES / SERVICES INCLUDED</div>
          <div className="b-grid2">{dels.map((x) => <span key={x}>☑ {x}</span>)}</div>
        </div>
      )}

      <table className="b-table">
        <thead><tr><th>PARTICULARS / PAYMENT DETAILS</th><th>AMOUNT (₹)</th></tr></thead>
        <tbody>
          <tr><td>Total Package Amount</td><td>{d.total}/-</td></tr>
          <tr><td>Advance Received</td><td>{d.advance}/-</td></tr>
          <tr className="bal"><td><b>Balance Amount</b></td><td>{balance}/-</td></tr>
        </tbody>
      </table>

      <div className="b-h2">TERMS &amp; CONDITIONS</div>
      <ol className="b-terms">
        {d.terms.split("\n").filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
      </ol>

      <div className="b-sign"><div>Client Signature</div><div>Authorized Signature</div></div>
      <div className="b-thanks">THANK YOU FOR CHOOSING Ram Photography</div>
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [d, setD] = useState({
    no: "", bookDate: today(), eventDate: "", name: "", phone: "", address: "",
    total: "", advance: "", terms: TERMS,
  });
  const [fOpts, setFOpts] = useState(FUNCTIONS);
  const [funcs, setFuncs] = useState([]);
  const [dOpts, setDOpts] = useState(DELIVERABLES);
  const [dels, setDels] = useState([]);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const wrap = useRef(null);
  const billRef = useRef(null);

  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const balance = (Number(d.total) || 0) - (Number(d.advance) || 0);

  useEffect(() => {
    const fit = () => wrap.current && setScale(Math.min(1, wrap.current.clientWidth / 794));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const download = async () => {
    setBusy(true);
    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#fff",
        onclone: (doc) => { doc.getElementById("scaler").style.transform = "none"; },
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const W = 210, H = 297;
      let w = W, h = (canvas.height * W) / canvas.width;
      if (h > H) { w = (W * H) / h; h = H; }
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", (W - w) / 2, 0, w, h);
      pdf.save(`${d.name || "bill"}-receipt.pdf`);
    } finally { setBusy(false); }
  };

  return (
    <div className="layout">
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <h2>Ram Photography – Bill Generator</h2>
        <div className="row">
          <label>Receipt No<input value={d.no} onChange={set("no")} /></label>
          <label>Booking Date<input type="date" value={d.bookDate} onChange={set("bookDate")} /></label>
          <label>Event Date<input type="date" value={d.eventDate} onChange={set("eventDate")} /></label>
        </div>
        <label>Client Name<input value={d.name} onChange={set("name")} /></label>
        <label>Contact No<input type="tel" value={d.phone} onChange={set("phone")} /></label>
        <label>Address<input value={d.address} onChange={set("address")} /></label>

        <Picker title="Client Function Details" options={fOpts} setOptions={setFOpts} selected={funcs} setSelected={setFuncs} />
        <Picker title="Client Deliverables / Services" options={dOpts} setOptions={setDOpts} selected={dels} setSelected={setDels} />

        <div className="row">
          <label>Total Amount (₹)<input type="number" inputMode="numeric" value={d.total} onChange={set("total")} /></label>
          <label>Advance (₹)<input type="number" inputMode="numeric" value={d.advance} onChange={set("advance")} /></label>
          <label>Balance (auto)<input value={balance} readOnly /></label>
        </div>
        <label>Terms &amp; Conditions (one per line)
          <textarea rows={8} value={d.terms} onChange={set("terms")} />
        </label>
        <button type="button" className="btn big" onClick={download} disabled={busy}>
          {busy ? "Generating..." : "Download A4 PDF"}
        </button>
      </form>

      <div className="preview" ref={wrap}>
        <div style={{ height: 1123 * scale }}>
          <div id="scaler" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 794 }}>
            <Bill d={d} funcs={funcs} dels={dels} balance={balance} innerRef={billRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
