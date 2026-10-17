// Regenerates the sponsor media kit PDF.
//   node scripts/build-media-kit.mjs
// Then upload it in Crew Portal -> Settings, or replace public/ihnm-media-kit.pdf.
//
// Kept as a script so the launch month and rates live in one editable place
// rather than inside a binary nobody can grep.
import PDFDocument from "pdfkit";
import { createWriteStream } from "node:fs";

const LAUNCH = "March 2027";
// Update this line once the 501(c)(3) determination letter arrives.
const NONPROFIT_STATUS = "501(c)(3) status pending";
const OUT = process.argv[2] ?? "public/ihnm-media-kit.pdf";

const INK = "#2b2520";
const GOLD = "#b8893b";
const MUTED = "#7d7265";
const RULE = "#e0d6c6";

const doc = new PDFDocument({
  size: "LETTER",
  margin: 56,
  autoFirstPage: true,
  bufferPages: true,
  info: {
    Title: "IHNM Show Sponsor Media Kit",
    Author: "IHNM Show",
    Subject: `Sponsorship packages — launching ${LAUNCH}`,
  },
});
doc.pipe(createWriteStream(OUT));

const W = doc.page.width - 112;
let page = 0;

function header() {
  // pdfkit adds a page whenever text crosses the bottom margin, even when the
  // text is explicitly positioned. Pages here are placed by hand, so the margin
  // is removed and layout is verified visually instead.
  doc.page.margins.bottom = 0;
  doc.font("Times-Bold").fontSize(20).fillColor(INK).text("IHNM ", 56, 50, { continued: true });
  doc.font("Times-BoldItalic").fillColor(GOLD).text("Show");
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(MUTED)
    .text("STUDIO A, SAN JOSE", 56, 74, { characterSpacing: 1.6 });
  doc
    .moveTo(56, 92)
    .lineTo(56 + W, 92)
    .strokeColor(RULE)
    .lineWidth(1)
    .stroke();
  doc.y = 110;
}

function footer() {
  page += 1;
  const y = doc.page.height - 56;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(`IHNM Show Sponsor Media Kit`, 56, y, { width: W / 2 })
    .text(`Page ${page} of 3`, 56 + W / 2, y, { width: W / 2, align: "right" });
}

const h1 = (t) => {
  doc.moveDown(0.3);
  doc.font("Times-Bold").fontSize(15).fillColor(INK).text(t);
  doc.moveDown(0.18);
};
const h2 = (t) => {
  doc.moveDown(0.5);
  doc.font("Times-Bold").fontSize(12).fillColor(GOLD).text(t);
  doc.moveDown(0.2);
};
const p = (t, opts = {}) => {
  doc
    .font("Helvetica")
    .fontSize(8.6)
    .fillColor(INK)
    .text(t, { width: W, lineGap: 1.4, ...opts });
  doc.moveDown(0.3);
};
const bullet = (label, body) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(8.6)
    .fillColor(INK)
    .text(`${label}  `, { continued: true, width: W });
  doc.font("Helvetica").fillColor(INK).text(body, { width: W, lineGap: 1.4 });
  doc.moveDown(0.22);
};

/** Fixed-column table with a tinted head row.
 *  Row geometry is computed from a captured y: reading doc.y inside the loop
 *  drifts, because every text call moves it. */
function table(cols, rows) {
  const xs = [];
  let x = 56;
  for (const c of cols) {
    xs.push(x);
    x += c.w;
  }

  let y = doc.y;
  const headH = 17;
  doc.rect(56, y, W, headH).fill("#f3ece0");
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7);
  cols.forEach((c, i) =>
    doc.text(c.label.toUpperCase(), xs[i] + 7, y + 6, {
      width: c.w - 14,
      characterSpacing: 0.3,
      lineBreak: false,
    }),
  );
  y += headH;

  for (const row of rows) {
    const heights = row.map((cell, i) =>
      doc
        .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7.6)
        .heightOfString(cell, { width: cols[i].w - 14, lineGap: 1.2 }),
    );
    const h = Math.max(...heights) + 10;
    row.forEach((cell, i) => {
      doc
        .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7.6)
        .fillColor(i === 0 ? INK : "#453e36")
        .text(cell, xs[i] + 7, y + 5, { width: cols[i].w - 14, lineGap: 1.2 });
    });
    y += h;
    doc
      .moveTo(56, y)
      .lineTo(56 + W, y)
      .strokeColor(RULE)
      .lineWidth(0.5)
      .stroke();
  }
  doc.y = y + 8;
  doc.x = 56;
}

// ---------------------------------------------------------------- page 1
header();
doc.font("Times-Bold").fontSize(24).fillColor(INK).text("Sponsor Media Kit", { width: W });
doc
  .font("Helvetica")
  .fontSize(9.5)
  .fillColor(GOLD)
  .moveDown(0.3)
  .text(`A live-audience talk show · Launching ${LAUNCH}`, { width: W });
doc.moveDown(0.6);

h1("About the show");
p(
  `IHNM Show is a live-audience talk show where Scripture, history and today's headlines meet in one conversation. It records at Studio A in San Jose and launches in ${LAUNCH}.`,
);
bullet(
  "Format:",
  "a host and 2–3 guests (Bible teachers, historians, experts, ministry leaders) in one flowing 45–60 minute conversation, with a live worship open and a studio audience brought into the discussion.",
);
bullet(
  "Specials:",
  "monthly live panel discussions on one big topic, streamed with audience and live-chat questions.",
);
bullet("Sit-Downs:", "monthly long-form interviews with a single guest.");
bullet(
  "Schedule:",
  "2 recording sessions a month at launch (one daytime, one evening), 4 episodes a month, released weekly.",
);

h1("Audience and reach");
p(
  "Founding sponsors join before launch, so they are on screen from the first episode and keep their rate as the audience grows.",
);
bullet(
  "Who watches:",
  "Bay Area churchgoers, families and adults who want Bible-centered conversation on history and current events.",
);
bullet(
  "In the room:",
  "15–20 audience members per recording, with on-site parking and a supervised Kids' Room.",
);
bullet(
  "Where it's seen:",
  "YouTube, Spotify, Apple Podcasts, Facebook, Instagram, TikTok, plus a weekly email newsletter on Substack.",
);
bullet(
  "Guest-amplified:",
  "every guest, expert, worship team and ministry gets a clip pack and agrees to share their episode with their own followers, so each episode reaches new audiences.",
);
bullet("Output each month:", "4 full episodes, about 12 longer clips and daily Shorts.");
doc
  .font("Helvetica-Oblique")
  .fontSize(8.5)
  .fillColor(MUTED)
  .text("Audience numbers will be reported to sponsors monthly from launch.", { width: W });
footer();

// ---------------------------------------------------------------- page 2
doc.addPage();
header();
h1("Sponsorship packages");
p(
  `Founding rates are locked for 12 months for sponsors who sign before the ${LAUNCH} launch. Sponsor mentions name the business, what it does and where it is.`,
);
table(
  [
    { label: "Package", w: 96 },
    { label: "Standard", w: 64 },
    { label: "Founding", w: 64 },
    { label: "Includes", w: W - 224 },
  ],
  [
    [
      "Episode Sponsor",
      "$500/month",
      "$250/month",
      "Name and logo in every episode that month, link in each YouTube description, 1 dedicated clip, thank-you in the newsletter",
    ],
    [
      "Segment Sponsor",
      "$350/month",
      "$200/month",
      "Name on one recurring part of the show (for example, the audience Q&A), logo on screen during that part, description link",
    ],
    [
      "Special Presenting Sponsor",
      "$1,000 per Special",
      "$500 per Special",
      "“Presented by” billing on the monthly live Special, mentions at open and close, logo on the livestream, 2 dedicated clips",
    ],
    [
      "Newsletter Feature",
      "$10/week",
      "$10/week",
      "One product or book featured in that week's email, marked Sponsored",
    ],
  ],
);

h1("In-kind partnerships");
p(
  "Businesses can partner with products or services instead of cash, and receive on-screen credit.",
);
table(
  [
    { label: "Partnership", w: 96 },
    { label: "You provide", w: 136 },
    { label: "You receive", w: W - 232 },
  ],
  [
    [
      "Wardrobe Partner",
      "Outfits or jewelry for the host, gifted or loaned",
      "“Wardrobe provided by” credit on screen, tags on YouTube and social, professional photos of the look",
    ],
    [
      "Refreshments Partner",
      "Coffee, pastries or light food for each recording",
      "On-screen credit, signage at the refreshments table, newsletter thank-you",
    ],
    [
      "Production Partner",
      "Lighting, audio or AV gear, or a discount on it",
      "“Production partner” credit in every episode, behind-the-scenes feature, website listing",
    ],
  ],
);
doc
  .font("Helvetica-Oblique")
  .fontSize(8.5)
  .fillColor(MUTED)
  .text(
    "IHNM is a nonprofit ministry with 501(c)(3) status pending. We provide receipts for in-kind gifts; whether a gift is tax-deductible depends on the IRS granting exemption.",
    { width: W },
  );
footer();

// ---------------------------------------------------------------- page 3
doc.addPage();
header();
h1("What sponsors receive");
p("Every sponsor gets a monthly recap showing exactly what they received.");
[
  "Views for each episode that carried their name",
  "Links to the clips and Shorts featuring them",
  "A screenshot of each on-screen mention",
  "A renewal reminder 30 days before the term ends",
].forEach((t) => {
  doc.font("Helvetica").fontSize(8.6).fillColor(GOLD).text("•  ", { continued: true, width: W });
  doc.fillColor(INK).text(t, { width: W, lineGap: 1.4 });
  doc.moveDown(0.14);
});
doc.moveDown(0.3);
p("Sponsors are also invited to tour Studio A and to attend recordings as guests of the show.");

h1("Reserve a founding rate");
p(
  "Founding rates close at launch. To claim one, send us a note and we'll reply with packages and available dates.",
);
doc.moveDown(0.2);
doc.rect(56, doc.y, W, 76).fill("#f3ece0");
const boxTop = doc.y + 14;
doc
  .font("Helvetica-Bold")
  .fontSize(10)
  .fillColor(INK)
  .text("ihnmshow.com/partner", 70, boxTop, { width: W - 28 });
doc
  .font("Helvetica")
  .fontSize(9)
  .fillColor("#453e36")
  .text("Jennifer Ogbuagu, Founder — IHNM Show", 70, boxTop + 18, { width: W - 28 })
  .text("Studio A, San Jose, California", 70, boxTop + 33, { width: W - 28 })
  .text("Or reply directly to the email this kit came with.", 70, boxTop + 48, { width: W - 28 });
footer();

doc.end();
console.log(`wrote ${OUT}`);
