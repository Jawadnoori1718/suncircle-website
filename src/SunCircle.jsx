/**
 * SunCircle — public information / marketing website
 * ------------------------------------------------------------------
 * Single-page marketing site for SunCircle, a peer-to-peer solar energy
 * sharing platform (run as a Community Interest Company). Its one job is to
 * help a first-time visitor understand what SunCircle is, believe it's
 * credible, and join the waitlist.
 *
 * Architecture notes:
 *  - Reuses the SunCircle brand/design system from the original product app:
 *    the Logo SVG, brand tokens, cards, buttons, pills and
 *    the accordion, restyled for a marketing layout (centred max-width,
 *    generous whitespace) rather than an app shell.
 *  - Real photography (Unsplash CDN) carries the hero and key sections.
 *  - Section components compose a single scrolling page with a sticky nav.
 *  - Motion is restrained: Intersection Observer scroll-reveal and
 *    count-up-on-view, both respecting prefers-reduced-motion.
 *  - No backend, no auth, no localStorage. The waitlist is the only
 *    interactive form and is isolated behind submitWaitlist().
 */

import { useState, useEffect, useRef, useId } from "react";
import {
  Sun, Zap, Home, ChevronDown, Check,
  CheckCircle2, ArrowRight, ArrowUpRight, PiggyBank, Sparkles, ShieldCheck,
  Coins, Building2, Quote, Lightbulb, TrendingUp, TrendingDown,
  PlugZap, Menu, X, Mail, Trophy, Award, Linkedin,
  Split, Network, Repeat, Send, BadgeCheck,
} from "lucide-react";

/* ============================================================ utilities */
const cx = (...a) => a.filter(Boolean).join(" ");
const gbp = (n, d = 0) =>
  "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Fires once when an element scrolls into view. */
function useInView({ threshold = 0.18, rootMargin = "0px 0px -8% 0px" } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return [ref, inView];
}

/** Number that counts up once it scrolls into view. */
function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1300 }) {
  const [ref, inView] = useInView({ threshold: 0.45 });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf; const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
}

/** Highlights the nav link for whichever section is currently in view. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(",");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const seen = new Map();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.intersectionRatio));
      let best = null, bestRatio = 0;
      seen.forEach((ratio, id) => { if (ratio > bestRatio) { bestRatio = ratio; best = id; } });
      if (best && bestRatio > 0) setActive(best);
    }, { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

function useScrolled(offset = 12) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > offset);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [offset]);
  return s;
}

/* ============================================================ brand mark */
function Logo({ size = 40 }) {
  const id = useId().replace(/:/g, "");
  const rays = Array.from({ length: 16 }).map((_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r1 = 15.5, r2 = i % 2 ? 27 : 22;
    return (
      <line key={i}
        x1={50 + Math.cos(a) * r1} y1={50 + Math.sin(a) * r1}
        x2={50 + Math.cos(a) * r2} y2={50 + Math.sin(a) * r2}
        stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    );
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="SunCircle" role="img">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a3d44b" />
          <stop offset="0.5" stopColor="#5fb43a" />
          <stop offset="1" stopColor="#1f9d3b" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill={`url(#g${id})`} />
      <circle cx="50" cy="50" r="41" fill="#fff" />
      <circle cx="50" cy="50" r="38" fill={`url(#g${id})`} />
      {rays}
      <circle cx="50" cy="50" r="11" fill="#fff" />
    </svg>
  );
}
const Wordmark = ({ className }) => <span className={cx("wordmark", className)}>SunCircle</span>;

/* ============================================================ primitives */
const Card = ({ as: T = "div", variant, className, children, ...p }) => (
  <T className={cx("card", variant && `card--${variant}`, className)} {...p}>{children}</T>
);

const Button = ({ as: T = "button", variant = "primary", size, block, className, children, ...p }) => (
  <T className={cx("btn", `btn--${variant}`, size && `btn--${size}`, block && "btn--block", className)} {...p}>
    {children}
  </T>
);

const Pill = ({ tone = "green", live, children }) => (
  <span className={cx("pill", `pill--${tone}`)}>
    {live && <span className="pill__dot" />}{children}
  </span>
);

const Eyebrow = ({ icon: Icon, children }) => (
  <span className="eyebrow">{Icon && <Icon size={13} strokeWidth={2.6} />}{children}</span>
);

/** Scroll-reveal wrapper — fades + lifts its children into view once. */
function Reveal({ as: T = "div", className, delay = 0, children, ...p }) {
  const [ref, inView] = useInView();
  return (
    <T ref={ref} className={cx("reveal", inView && "reveal--in", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...p}>
      {children}
    </T>
  );
}

/* ================================================================= photo */
const UNSPLASH = "https://images.unsplash.com/";
function Photo({ id, alt, className, eager, w = 1100 }) {
  // Local files (e.g. "/awards/melete.jpg") or full URLs are used as-is;
  // anything else is treated as an Unsplash photo id.
  const src = /^(https?:\/\/|\/)/.test(id) ? id : `${UNSPLASH}${id}?auto=format&fit=crop&w=${w}&q=80`;
  return (
    <img className={cx("photo", className)} alt={alt} src={src}
      loading={eager ? "eager" : "lazy"} decoding="async" />
  );
}

/* ============================================================ accordion */
function Accordion({ items, defaultOpen = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="acc">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <Card key={i} className={cx("accitem", isOpen && "accitem--open")}>
            <h3 className="accitem__h">
              <button className="accitem__head" aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}>
                <span className="accitem__icon"><it.icon size={17} strokeWidth={2.3} /></span>
                <span className="accitem__title">{it.title}</span>
                <ChevronDown size={18} className="accitem__chev" />
              </button>
            </h3>
            <div className="accitem__wrap">
              <div className="accitem__body">{it.body}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================ shared section scaffolding */
function SectionHead({ eyebrow, eyebrowIcon, title, lead, center }) {
  return (
    <Reveal className={cx("sectionhead", center && "sectionhead--center")}>
      {eyebrow && <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>}
      <h2 className="sectionhead__title">{title}</h2>
      {lead && <p className="sectionhead__lead">{lead}</p>}
    </Reveal>
  );
}

/* =============================================================== CONTENT */
const NAV_LINKS = [
  { id: "how", label: "How it works" },
  { id: "founder", label: "Founder" },
  { id: "recognition", label: "Recognition" },
  { id: "plans", label: "Plans" },
  { id: "faq", label: "FAQ" },
];

/* --------------------------------------------------------------- nav */
function Nav() {
  const scrolled = useScrolled();
  const active = useActiveSection(NAV_LINKS.map((l) => l.id));
  const [open, setOpen] = useState(false);
  return (
    <header className={cx("nav", scrolled && "nav--scrolled")}>
      <div className="wrap nav__bar">
        <a href="#top" className="nav__brand" aria-label="SunCircle home">
          <Logo size={32} /><Wordmark />
        </a>
        <nav className="nav__links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`}
              className={cx("nav__link", active === l.id && "nav__link--on")}
              aria-current={active === l.id ? "true" : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav__cta">
          <Button as="a" href="#waitlist" size="sm">Join the waitlist</Button>
        </div>
        <button className="nav__burger" aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="nav__mobile" aria-label="Mobile">
          {NAV_LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="nav__mlink" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Button as="a" href="#waitlist" block onClick={() => setOpen(false)}>Join the waitlist</Button>
        </nav>
      )}
    </header>
  );
}

/* --------------------------------------------------------------- hero */
function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero__bg">
        <video className="photo hero__video" autoPlay loop muted playsInline
          poster="/hero.jpg" aria-hidden="true">
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero__scrim" />
      </div>
      <div className="wrap hero__inner">
        <Reveal className="hero__copy">
          <h1 className="hero__h1">
            Share the Sun.<br /><span className="hero__accent">Power Your Community.</span>
          </h1>
          <p className="hero__sub">
            Buy cheaper local energy from a verified neighbour, or share and earn from your
            own solar panels. Clean, local power, shared by the community.
          </p>
          <div className="hero__ctas">
            <Button as="a" href="#waitlist" size="lg">Join the waitlist <ArrowRight size={18} /></Button>
            <Button as="a" href="#how" size="lg" variant="glass">See how it works <ArrowRight size={18} /></Button>
          </div>
          <div className="hero__stats">
            <div><b className="num">Up to 50%</b><span>cheaper energy</span></div>
            <div><b className="num">Cancel anytime</b><span>no contract</span></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ problem */
function Problem() {
  const stats = [
    { icon: Coins, approx: "≈", value: 24, suffix: "p", label: "to buy a kWh from the grid",
      sub: "What UK homes pay for their power." },
    { icon: ArrowUpRight, approx: "≈", value: 4, suffix: "p", label: "paid for the solar they export",
      sub: "Owners sell low, then buy back high." },
    { icon: Sun, value: 1.3, decimals: 1, suffix: "M+", label: "UK homes already have solar",
      sub: "Most of it exported and wasted." },
  ];
  const barriers = [
    { img: "/barriers/landlord.jpg", imgAlt: "A person gesturing no",
      title: "Landlords won't permit it", desc: "Most tenants have no right to install panels on a roof they don't own.",
      source: "Energy Saving Trust", href: "https://energysavingtrust.org.uk/advice/solar-panels/" },
    { img: "/barriers/cost.jpg", imgAlt: "Solar panels and the cost of installing them",
      title: "Upfront cost is steep", desc: "A typical home system runs £5,000 to £9,000 before you save a penny.",
      source: "MoneySavingExpert", href: "https://www.moneysavingexpert.com/utilities/solar-panels/" },
    { img: "/barriers/tenancy.jpg", imgAlt: "Signing a short tenancy agreement",
      title: "Tenancies are short", desc: "A roughly 4 year lease against a roughly 10 year payback rarely adds up.",
      source: "Which?", href: "https://www.which.co.uk/reviews/solar-panels" },
  ];
  return (
    <section id="problem" className="section section--tint">
      <div className="wrap">
        <SectionHead eyebrow="The problem" eyebrowIcon={Lightbulb} center
          title="Energy is expensive, and most solar value is wasted." />

        <div className="pstats">
          {stats.map((s) => (
            <Card key={s.label} className="pstat">
              <span className="pstat__ic"><s.icon size={20} strokeWidth={2.3} /></span>
              <div className="pstat__n">
                {s.approx && <span className="pstat__approx">{s.approx}</span>}
                <CountUp to={s.value} decimals={s.decimals || 0} suffix={s.suffix} />
              </div>
              <div className="pstat__l">{s.label}</div>
              <div className="pstat__s">{s.sub}</div>
            </Card>
          ))}
        </div>

        <Reveal className="problem__barriers-head">
          <h3>And most people can't install solar at all.</h3>
          <p className="muted">Three barriers lock renters and millions of homes out entirely.</p>
        </Reveal>
        <div className="grid g3">
          {barriers.map((b, i) => (
            <Reveal key={b.title} delay={i * 90}>
              <Card as="a" href={b.href} target="_blank" rel="noopener noreferrer"
                className="barrier" aria-label={`${b.title}. Read more on ${b.source} (opens in a new tab)`}>
                <div className="barrier__media">
                  <Photo id={b.img} alt={b.imgAlt} />
                </div>
                <div className="barrier__body">
                  <h4 className="barrier__t">{b.title}</h4>
                  <p className="barrier__d">{b.desc}</p>
                  <span className="barrier__src">Read more <ArrowUpRight size={14} strokeWidth={2.6} /></span>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}

/* --------------------------------------------------------- how it works */
// A small "live data" sparkline with a highlight that keeps climbing upward.
function Sparkline() {
  const pts = "0,31 17,28 34,29 51,21 68,23 85,14 102,16 120,4";
  return (
    <svg className="spark" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
      <polyline className="spark__base" points={pts} />
      <polyline className="spark__flow" points={pts} />
    </svg>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: Network, title: "Match", desc: "We pair you with a verified solar neighbour near you, no roof of your own required." },
    { n: "02", icon: Repeat, title: "Switch", desc: "Move your supply across in minutes. No long contract, cancel any time." },
    { n: "03", icon: PiggyBank, title: "Save", desc: "Save up to around 50% on every kWh of clean, local solar energy." },
  ];
  const roles = [
    { icon: Home, title: "Buy Clean Energy", tag: "Nothing to install", viz: "buy",
      desc: "Get cheaper, local solar power straight from a neighbour. No panels, no roof, no upfront cost.",
      feats: ["Up to around 50% cheaper energy", "Switch with no contract", "Live sharing dashboard"],
      stat: { cap: "Live price", val: "12.4p", unit: "/kWh", delta: "31% cheaper", down: true } },
    { icon: Sun, title: "Share Solar Energy", tag: "Turn export into income", viz: "share",
      desc: "Already have panels? Turn the surplus you'd export cheaply into income, and power your neighbours.",
      feats: ["Earn from spare generation", "Keep solar value local", "Power your neighbours"],
      stat: { cap: "Today's earnings", val: "£3.84", unit: "", delta: "Sharing now", down: false } },
  ];
  return (
    <section id="how" className="section">
      <div className="wrap">
        <SectionHead eyebrow="How it works" eyebrowIcon={Split} center
          title="Three steps to cheaper, shared solar."
          lead="No hardware to buy. No installer to wait for. Just an app." />

        <div className="flow">
          <div className="flow__rail" aria-hidden="true"><span className="flow__pulse" /></div>
          {steps.map((s, i) => (
            <Reveal key={s.title} className="flowstep" delay={i * 140}>
              <div className="flowstep__badge">
                <span className="flowstep__num" aria-hidden="true">{s.n}</span>
                <span className="flowstep__ic"><s.icon size={24} strokeWidth={2.1} /></span>
              </div>
              <div className="flowstep__body">
                <h3 className="flowstep__t">{s.title}</h3>
                <p className="flowstep__d">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="wrap">
        <div className="roles__grid">
          {roles.map((r, i) => (
            <Reveal key={r.title} delay={i * 100}>
              <Card className="rolecard">
                <div className={cx("roleviz", `roleviz--${r.viz}`)}>
                  <span className="roleviz__glow" aria-hidden="true" />
                  <span className="roleviz__ic"><r.icon size={30} strokeWidth={2} /></span>
                  <div className="roleviz__stat">
                    <span className="roleviz__cap">{r.stat.cap}</span>
                    <span className="roleviz__val num">{r.stat.val}<small>{r.stat.unit}</small></span>
                    <span className={cx("roleviz__delta", r.stat.down && "is-down")}>
                      {r.stat.down ? <TrendingDown size={13} /> : <TrendingUp size={13} />}{r.stat.delta}
                    </span>
                    <Sparkline />
                  </div>
                </div>
                <div className="rolecard__content">
                  <Pill tone="amber">{r.tag}</Pill>
                  <h4 className="rolecard__t">{r.title}</h4>
                  <p className="rolecard__d">{r.desc}</p>
                  <ul className="rolecard__feats">
                    {r.feats.map((f) => <li key={f}><Check size={15} strokeWidth={2.8} />{f}</li>)}
                  </ul>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- plans */
function Plans() {
  const plans = [
    { id: "spark", name: "Spark", price: 4.99, tag: null, blurb: "Dip a toe into shared solar.", feats: ["Match with 1 solar neighbour", "Up to 30% bill savings", "Live sharing dashboard"] },
    { id: "glow", name: "Glow", price: 9.99, tag: "Most popular", blurb: "The everyday SunCircle plan.", feats: ["Match with 3 neighbours", "Up to around 50% bill savings", "Live impact tracking", "Priority matching"] },
    { id: "radiance", name: "Radiance", price: 14.99, tag: null, blurb: "Maximise savings and impact.", feats: ["Unlimited matching", "Maximum savings", "Support neighbours in need", "Priority new features"] },
  ];
  return (
    <section id="plans" className="section">
      <div className="wrap">
        <SectionHead eyebrow="Membership" eyebrowIcon={Sparkles} center
          title="Simple plans at launch."
          lead="Indicative launch pricing. Lock in early access by joining the waitlist." />
        <div className="grid g3 plans">
          {plans.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <Card className={cx("plan", p.tag && "plan--hot")}>
                {p.tag && <span className="plan__tag"><Sparkles size={11} strokeWidth={3} />{p.tag}</span>}
                <div className="plan__name">{p.name}</div>
                <div className="plan__blurb">{p.blurb}</div>
                <div className="plan__price num">{gbp(p.price, 2)}<small>/month</small></div>
                <ul className="plan__feats">
                  {p.feats.map((f) => <li key={f}><Check size={15} strokeWidth={2.8} />{f}</li>)}
                </ul>
                <Button as="a" href="#waitlist" variant={p.tag ? "primary" : "outline"} block>Join the waitlist</Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- founder / mission */
const FOUNDER_LINKEDIN = "https://www.linkedin.com/in/jawadnoori1/";
const COMPANY_LINKEDIN = "https://www.linkedin.com/company/suncircle1/?viewAsMember=true";
const FOUNDER_IMG = "/founder.jpg";
// Optional separate photo for phones. Once you add public/founder-mobile.jpg,
// change this to "/founder-mobile.jpg". Until then it reuses the desktop one.
const FOUNDER_IMG_MOBILE = "/founder-mobile.jpg";

function Mission() {
  return (
    <section id="founder" className="section section--tint">
      <div className="wrap">
        <SectionHead eyebrow="Our mission" eyebrowIcon={Quote} center
          title="Why I started SunCircle." />
        <Reveal>
          <Card className="founder">
            <div className="founder__media">
              <picture>
                <source media="(max-width:680px)" srcSet={FOUNDER_IMG_MOBILE} />
                <img className="photo" src={FOUNDER_IMG} alt="Jawad Noori, founder of SunCircle"
                  loading="lazy" decoding="async" />
              </picture>
            </div>
            <div className="founder__body">
              <Quote size={30} className="founder__q" />
              <p className="founder__quote">
                The sun does not send anyone a bill. Yet the people who need energy most pay
                the most for it. I am building SunCircle to put energy back in the hands of
                communities.
              </p>
              <div className="founder__person">
                <div className="founder__name">Jawad Noori</div>
                <div className="founder__role">Founder, SunCircle</div>
                <a className="founder__link" href={FOUNDER_LINKEDIN} target="_blank" rel="noopener noreferrer"
                  aria-label="Jawad Noori on LinkedIn (opens in a new tab)">
                  <Linkedin size={18} /> LinkedIn
                </a>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------- recognition / traction */
// To use your own photos: drop files into `public/awards/` and change each `img`
// below to e.g. "/awards/melete.jpg" (the Photo component supports local paths).
const AWARDS = [
  { icon: Trophy, name: "Melete Social Impact Competition", note: "Winner · £5,000",
    img: "/awards/melete.jpg",
    desc: "Recognised as the standout social impact venture, awarded £5,000 to take SunCircle forward.",
    href: "https://students.brunel.ac.uk/campus-news/melete-social-impact-competition-2026-meet-the-winners",
    liId: "7444319821967691776",
    li: "https://www.linkedin.com/posts/jawadnoori1_venturecrawl-activity-7444319821967691776-w9gS" },
  { icon: Award, name: "London Venture Crawl (KCL)", note: "Highly Commended",
    img: "/awards/venture-crawl.jpeg",
    desc: "Highly Commended at the King's College London Venture Crawl for early-stage ventures.",
    href: "https://students.brunel.ac.uk/campus-news/brunel-students-explore-londons-entrepreneurial-ecosystem-at-london-venture-crawl",
    liId: "7440085926946471936",
    li: "https://www.linkedin.com/posts/jawadnoori1_venturecrawl-activity-7440085926946471936-Ki1f" },
  { icon: Sparkles, name: "Brunel Business Expo", note: "Most Innovative Idea",
    img: "/awards/business-expo.jpeg",
    desc: "Named Most Innovative Idea at the Brunel Business Expo.",
    href: "https://www.linkedin.com/posts/brunelbusinessschool_brunelbusinessschool-studentexperience-entrepreneurship-ugcPost-7458520093015085056-yNmY",
    liId: "7458491689540792320",
    li: "https://www.linkedin.com/posts/jawadnoori1_this-is-turning-out-to-be-my-favourite-year-activity-7458491689540792320-5lq0" },
  { icon: Zap, name: "Red Bull Basement", note: "Runner Up · 2026",
    img: "/awards/red-bull.jpeg",
    desc: "Runner Up in the 2026 Red Bull Basement competition, after pitching at Red Bull HQ.",
    href: "https://students.brunel.ac.uk/campus-news/brunel-startups-shine-at-red-bull-basement-uk-national-final-2026",
    liId: "7460773087823753216",
    li: "https://www.linkedin.com/posts/jawadnoori1_in-january-i-decided-to-stop-drinking-red-activity-7460773087823753216-1voW" },
  { icon: BadgeCheck, name: "Santander X UK Awards", note: "Stage 2",
    img: "/awards/santander.jpg",
    desc: "Progressed to Stage 2 of the Santander X UK Awards.",
    href: "https://www.santanderx.com/en/sites/santander-x-uk-awards.html",
    liId: "7465048588608266244",
    li: "https://www.linkedin.com/posts/remyfoucher_final-call-for-the-2026-santanderx-awards-activity-7465048588608266244-70jb" },
  { icon: Building2, name: "Brunel Entrepreneur Hub", note: "Supported",
    img: "/awards/entrupreneur-hub.webp",
    desc: "Backed and mentored by the Brunel Entrepreneur Hub.",
    href: "https://www.brunel.ac.uk/student-professional-development/entrepreneur-hub/news-and-events/news/Welcoming-Catalonia's-Next-Generation-of-Entrepreneurs-to-Brunel",
    liId: "7473300277035532288",
    li: "https://www.linkedin.com/posts/brunel-hub_brunelsummerincubator-bruneluniversitylondon-activity-7473300277035532288-uVYg" },
];

/* ============================================================ modal/lightbox */
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__bar">
          <strong className="modal__title">{title}</strong>
          <button className="modal__x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Recognition() {
  const [active, setActive] = useState(null);
  const a = active != null ? AWARDS[active] : null;
  return (
    <section id="recognition" className="section section--tint">
      <div className="wrap">
        <SectionHead eyebrow="Recognition & traction" eyebrowIcon={Trophy} center
          title="Backed by competitions, accelerators, and a growing community."
          lead="Tap a card to see the post, or Read more for the full story." />
        <div className="awards">
          {AWARDS.map((aw, i) => (
            <Reveal key={aw.name} delay={i * 60}>
              <Card className="award" role="button" tabIndex={0}
                onClick={() => setActive(i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } }}
                aria-haspopup="dialog" aria-label={`${aw.name}. Open post`}>
                <div className="award__media">
                  <Photo id={aw.img} alt={aw.name} />
                </div>
                <div className="award__body">
                  <div className="award__head">
                    <span className="award__ic"><aw.icon size={16} strokeWidth={2.4} /></span>
                    <span className="award__name">{aw.name}</span>
                  </div>
                  <Pill tone="amber">{aw.note}</Pill>
                  <p className="award__desc">{aw.desc}</p>
                  <a className="award__more" href={aw.href} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}>Read more <ArrowUpRight size={14} strokeWidth={2.6} /></a>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>

      <Modal open={active != null} onClose={() => setActive(null)} title={a ? a.name : ""}>
        {a && (
          <div className="modal__li">
            <iframe className="modal__frame" title={`${a.name} on LinkedIn`}
              src={`https://www.linkedin.com/embed/feed/update/urn:li:activity:${a.liId}`}
              allowFullScreen loading="lazy" />
            <a className="modal__lilink" href={a.li} target="_blank" rel="noopener noreferrer">
              <Linkedin size={16} /> View on LinkedIn
            </a>
          </div>
        )}
      </Modal>
    </section>
  );
}

/* ----------------------------------------------------------------- faq */
function FAQ() {
  const items = [
    { icon: Sparkles, title: "Is SunCircle available yet?", body: (
      <p>Not yet. We are still in development and have not launched. Join the waitlist and you will
        be among the first invited when we open in your area.</p>) },
    { icon: Home, title: "Do I need my own solar panels?", body: (
      <p>No. If you want to buy energy, there will be nothing to install, you would simply access
        cheaper, locally generated solar through SunCircle. And if you do have panels, SunCircle is
        designed to let you earn more from the surplus you would otherwise export.</p>) },
    { icon: Network, title: "How is the sharing designed to work?", body: (
      <p>SunCircle is designed to match you with a verified solar producer nearby, so that the energy
        you use is linked to local solar generation, all visible in a simple live dashboard. The
        commercial flow is designed to operate through <b>licensed energy suppliers</b>, in line with
        how energy supply is regulated in the UK.</p>) },
    { icon: ShieldCheck, title: "Is it regulated and safe?", body: (
      <p>We are building SunCircle to be fully compliant. We are in early conversations with licensed
        suppliers and exploring <b>Ofgem's regulatory innovation pathways</b>, including its Regulatory
        Sandbox. These are exploratory discussions, and nothing here implies a confirmed agreement,
        partnership, or endorsement.</p>) },
    { icon: Coins, title: "What will it cost?", body: (
      <p>We are still finalising pricing, so any figures are indicative only and will be confirmed
        before launch. Our aim is simple: to make local, clean energy meaningfully cheaper than the
        standard grid rate, so buyers save while solar owners earn more.</p>) },
    { icon: PlugZap, title: "Will my electricity supply be interrupted?", body: (
      <p>No. SunCircle is designed to work on top of a compliant, licensed energy supply, so your
        power stays exactly as reliable as before. The goal is simply cheaper, more local, greener
        energy, with no disruption.</p>) },
  ];
  return (
    <section id="faq" className="section">
      <div className="wrap">
        <SectionHead eyebrow="Questions" eyebrowIcon={Lightbulb} center
          title="Frequently asked questions" />
        <Reveal><Accordion items={items} defaultOpen={-1} /></Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ waitlist */
// Paste your Google Apps Script Web App URL here (see waitlist-backend.gs for setup).
// Leave blank to run in demo mode (form works visually but nothing is stored/emailed).
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbwFl3YpfW_Wla27pmF-dae_mKmZ0jpoy_r1xwv0qTY0TJI17UURG9jP5mdq9gzMMfIW3Q/exec";

async function submitWaitlist(email) {
  if (!WAITLIST_ENDPOINT) {
    // Demo mode: no backend configured yet.
    await new Promise((res) => setTimeout(res, 700));
    return { ok: true, email };
  }
  // `no-cors` lets us POST to the Apps Script endpoint from the browser.
  // The submission is saved and the thank-you email is sent server-side.
  await fetch(WAITLIST_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ email, source: "website", ts: new Date().toISOString() }),
  });
  return { ok: true, email };
}

function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | invalid | loading | done | error
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "loading") return;
    if (!valid) { setStatus("invalid"); return; }
    setStatus("loading");
    try {
      await submitWaitlist(email);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="waitlist" className="section section--cta">
      <div className="wrap">
        <Reveal>
          <Card className="cta">
            <div className="cta__glow" aria-hidden="true" />
            <div className="cta__row">
              <div className="cta__text">
                <span className="cta__eyebrow"><Sun size={14} strokeWidth={2.6} /> Join the waitlist</span>
                <h2 className="cta__h">Be one of our first customers.</h2>
                <p className="cta__sub">
                  SunCircle is launching area by area. Add your email and we'll tell you the
                  moment cheaper, local solar reaches your neighbourhood.
                </p>
              </div>

              <div className="cta__action">
                {status === "done" ? (
                  <div className="cta__done" role="status" aria-live="polite">
                    <span className="cta__check"><CheckCircle2 size={24} strokeWidth={2.4} /></span>
                    <div>
                      <strong>You're on the list.</strong>
                      <span>We'll email <b>{email}</b> the moment we launch near you.</span>
                    </div>
                  </div>
                ) : (
                  <form className="cta__form" onSubmit={onSubmit} noValidate>
                    <label htmlFor="wl-email" className="sr-only">Email address</label>
                    <input id="wl-email" className="cta__field" type="email" inputMode="email"
                      autoComplete="email" placeholder="you@example.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); if (status !== "idle") setStatus("idle"); }}
                      aria-invalid={status === "invalid" || status === "error" ? "true" : undefined} />
                    <button type="submit" className="cta__btn" disabled={status === "loading"}>
                      {status === "loading" ? "Joining…" : <>Join the waitlist <Send size={16} /></>}
                    </button>
                  </form>
                )}
                {status === "invalid" && <p className="cta__msg" role="alert">Please enter a valid email address.</p>}
                {status === "error" && <p className="cta__msg" role="alert">Something went wrong, please try again.</p>}
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- footer */
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brandcol">
          <a href="#top" className="footer__brand"><Logo size={30} /><Wordmark /></a>
          <p className="footer__tag">Peer to peer solar energy, shared by the community.</p>
          <a className="footer__linkedin" href={COMPANY_LINKEDIN} target="_blank" rel="noopener noreferrer">
            <Linkedin size={18} /> Follow on LinkedIn
          </a>
        </div>
        <nav className="footer__col" aria-label="Footer">
          <h3>Explore</h3>
          {NAV_LINKS.map((l) => <a key={l.id} href={`#${l.id}`}>{l.label}</a>)}
        </nav>
        <div className="footer__col">
          <h3>Contact</h3>
          <a href="mailto:hello@suncircle.co.uk"><Mail size={14} /> hello@suncircle.co.uk</a>
          <a href="#waitlist">Join the waitlist</a>
        </div>
      </div>
      <div className="wrap footer__base">
        <p className="footer__copy">© SunCircle {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

/* ================================================================= ROOT */
export default function App() {
  return (
    <div className="sc-root">
      <Styles />
      <a href="#top" className="skip">Skip to content</a>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Mission />
        <Recognition />
        <Plans />
        <FAQ />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}

function Styles() {
  return <style>{css}</style>;
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

html,body{margin:0;padding:0}
body{background:#fdfcf4}
#root{overflow-x:clip}

.sc-root{
  --primary:#22c55e; --primary-deep:#16a34a; --forest:#14532d; --forest-2:#0f5132;
  --solar:#f5c518; --danger:#ef4444;
  --bg1:#eefaf1; --bg2:#fdfcf4; --surface:#ffffff;
  --ink:#0e2a1d; --ink-2:#33503f; --muted:#6b8577; --line:rgba(34,197,94,.16);
  --shadow:0 6px 22px -10px rgba(15,81,50,.22); --shadow-lg:0 24px 60px -24px rgba(15,81,50,.35);
  --radius:20px; --radius-sm:14px; --nav-h:66px; --maxw:1440px;
  font-family:'Plus Jakarta Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  color:var(--ink); -webkit-font-smoothing:antialiased; line-height:1.55;
  background:radial-gradient(120% 60% at 50% -8%,var(--bg1),var(--bg2));
}
.sc-root *{box-sizing:border-box}
.sc-root button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.sc-root a{color:inherit;text-decoration:none}
.num{font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.muted{color:var(--muted)} .center{text-align:center}
.wordmark{font-weight:800;font-size:1.18rem;letter-spacing:-.02em;
  background:linear-gradient(95deg,#7cc23a,#16a34a);-webkit-background-clip:text;background-clip:text;color:transparent}
.grad{background:linear-gradient(95deg,#34c759,#15803d);-webkit-background-clip:text;background-clip:text;color:transparent}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.skip{position:absolute;left:-999px;top:8px;z-index:200;background:#fff;color:var(--forest);font-weight:700;
  padding:10px 16px;border-radius:12px;box-shadow:var(--shadow)}
.skip:focus{left:12px}

html{scroll-behavior:smooth}
section[id], [id="top"]{scroll-margin-top:84px}

.wrap{max-width:var(--maxw);margin:0 auto;padding:0 clamp(20px,4.5vw,44px);width:100%}
.section{padding:clamp(64px,9vw,104px) 0}
.section--tint{background:transparent}

/* reveal (kept constant — content is always visible, no fade-in) --- */
.reveal,.reveal--in{opacity:1;transform:none}

/* primitives ------------------------------------------------------- */
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:22px;box-shadow:var(--shadow)}
.card--mint{background:linear-gradient(180deg,#f1fbf4,#fbfef9)}
.card--forest{background:linear-gradient(120deg,#2bbf5a,#16a34a);color:#fff;border-color:transparent}
.card--forest .muted,.card--forest span{color:rgba(255,255,255,.82)}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:14.5px;
  padding:12px 20px;border-radius:14px;transition:.18s;white-space:nowrap;text-align:center}
.btn:active{transform:translateY(1px)}
.btn[disabled]{opacity:.55;cursor:not-allowed}
.btn--primary{background:linear-gradient(95deg,#22c55e,#16a34a);color:#fff;box-shadow:0 12px 24px -10px rgba(22,163,74,.7)}
.btn--primary:hover{filter:brightness(1.05);box-shadow:0 16px 30px -10px rgba(22,163,74,.8)}
.btn--outline{background:#fff;border:1.5px solid var(--line);color:var(--forest-2)}
.btn--outline:hover{border-color:var(--primary);background:rgba(34,197,94,.05)}
.btn--ghost{background:rgba(34,197,94,.08);color:var(--primary-deep)} .btn--ghost:hover{background:rgba(34,197,94,.14)}
.btn--glass{background:rgba(255,255,255,.12);color:#fff;font-weight:700;border:1.5px solid #fff;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:.22s cubic-bezier(.4,0,.2,1)}
.btn--glass:hover{background:#fff;color:var(--forest-2);transform:translateY(-2px);
  box-shadow:0 16px 32px -14px rgba(0,0,0,.5)}
.btn--glass svg{transition:transform .22s cubic-bezier(.4,0,.2,1)}
.btn--glass:hover svg{transform:translateX(3px)}
.btn--lg{padding:15px 24px;font-size:16px;border-radius:16px} .btn--sm{padding:9px 15px;font-size:13.5px}
.btn--block{width:100%}

.pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;white-space:nowrap}
.pill--green{background:rgba(34,197,94,.14);color:var(--primary-deep)}
.pill--amber{background:rgba(245,197,24,.2);color:#9a7400}
.pill--neutral{background:rgba(20,83,45,.08);color:var(--ink-2)}
.card--forest .pill{background:rgba(255,255,255,.18);color:#fff}
.pill__dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:livedot 2s infinite}
@keyframes livedot{0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 6px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}

.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--primary-deep)}

/* section heads ---------------------------------------------------- */
.sectionhead{display:flex;flex-direction:column;gap:12px;margin-bottom:clamp(34px,4.5vw,48px);max-width:680px}
.sectionhead--center{align-items:center;text-align:center;margin-left:auto;margin-right:auto}
.sectionhead__title{font-size:clamp(26px,4vw,38px);font-weight:800;letter-spacing:-.03em;line-height:1.12;color:var(--forest);margin:0}
.sectionhead__lead{font-size:16px;color:var(--ink-2);margin:0;max-width:620px}

/* grids ------------------------------------------------------------ */
.grid{display:grid;gap:18px}
.grid>.reveal{height:100%}
.grid.g2{grid-template-columns:1fr 1fr}
.grid.g3{grid-template-columns:repeat(3,1fr)}
@media(max-width:860px){.grid.g3{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.grid.g2,.grid.g3{grid-template-columns:1fr}}

/* nav -------------------------------------------------------------- */
.nav{position:sticky;top:0;z-index:100;
  background:linear-gradient(180deg,rgba(253,252,244,.6),rgba(253,252,244,.35));
  -webkit-backdrop-filter:blur(10px) saturate(150%);backdrop-filter:blur(10px) saturate(150%);
  border-bottom:1px solid transparent;will-change:background,backdrop-filter,box-shadow;
  transition:background .5s cubic-bezier(.4,0,.2,1),box-shadow .5s cubic-bezier(.4,0,.2,1),
    backdrop-filter .5s cubic-bezier(.4,0,.2,1),-webkit-backdrop-filter .5s cubic-bezier(.4,0,.2,1),border-color .5s cubic-bezier(.4,0,.2,1)}
.nav--scrolled{background:linear-gradient(180deg,rgba(253,252,244,.86),rgba(253,252,244,.7));
  -webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);
  border-bottom-color:rgba(34,197,94,.14);box-shadow:0 10px 34px -18px rgba(15,81,50,.4)}
.nav__bar{height:var(--nav-h);display:flex;align-items:center;gap:18px}
.nav__brand{display:flex;align-items:center;gap:9px;margin-right:auto}
.nav__links{display:flex;align-items:center;gap:4px}
.nav__link{font-size:14px;font-weight:600;color:var(--ink-2);padding:8px 12px;border-radius:10px;transition:.18s;position:relative}
.nav__link:hover{color:var(--primary-deep);background:rgba(34,197,94,.07)}
.nav__link--on{color:var(--primary-deep)}
.nav__link--on:after{content:"";position:absolute;left:12px;right:12px;bottom:2px;height:2px;border-radius:2px;background:linear-gradient(95deg,#22c55e,#16a34a)}
.nav__cta{margin-left:8px}
.nav__burger{display:none;width:42px;height:42px;border-radius:12px;align-items:center;justify-content:center;color:var(--forest)}
.nav__mobile{display:flex;flex-direction:column;gap:6px;padding:10px 24px 18px;background:rgba(253,252,244,.97);backdrop-filter:blur(14px);border-top:1px solid var(--line)}
.nav__mlink{padding:11px 12px;border-radius:12px;font-weight:600;color:var(--ink-2)}
.nav__mlink:hover{background:rgba(34,197,94,.08);color:var(--primary-deep)}
@media(max-width:860px){
  .nav__links,.nav__cta{display:none}
  .nav__burger{display:inline-flex}
}

/* hero (full-bleed) ------------------------------------------------ */
.hero{position:relative;min-height:calc(100vh - var(--nav-h) * 2);display:flex;align-items:center;
  padding:clamp(48px,8vw,80px) 0;overflow:hidden}
@supports (min-height:100dvh){.hero{min-height:calc(100dvh - var(--nav-h) * 2)}}
.hero__bg{position:absolute;inset:0;z-index:0}
.hero__bg .photo{width:100%;height:100%}
.hero__scrim{position:absolute;inset:0;background:
  linear-gradient(100deg,rgba(8,38,24,.92) 0%,rgba(8,38,24,.72) 40%,rgba(8,38,24,.3) 74%,rgba(8,38,24,.12) 100%),
  linear-gradient(0deg,rgba(8,38,24,.5),transparent 42%)}
.hero__inner{position:relative;z-index:1}
.hero__copy{max-width:680px;display:flex;flex-direction:column;align-items:flex-start;gap:20px}
.hero__eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;
  color:#eafff1;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);
  backdrop-filter:blur(6px);padding:7px 13px;border-radius:999px}
.hero__h1{font-size:clamp(34px,6.4vw,72px);line-height:1.04;font-weight:800;letter-spacing:-.04em;color:#fff;margin:0;
  text-shadow:0 2px 24px rgba(0,0,0,.25)}
.hero__accent{background:linear-gradient(95deg,#bff299,#fde68a);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero__sub{font-size:clamp(16px,2.1vw,20px);color:rgba(255,255,255,.92);margin:0;max-width:600px;line-height:1.55}
.hero__ctas{display:flex;gap:12px;flex-wrap:wrap}
.hero__stats{display:flex;gap:34px;flex-wrap:wrap;margin-top:10px;padding-top:22px;border-top:1px solid rgba(255,255,255,.22)}
.hero__stats b{display:block;font-size:clamp(20px,3vw,26px);font-weight:800;color:#fff}
.hero__stats span{font-size:13px;color:rgba(255,255,255,.82)}
@media(max-width:600px){
  .hero{min-height:auto;text-align:left}
  .hero__stats{gap:22px}
  .hero__scrim{background:
    linear-gradient(180deg,rgba(8,38,24,.5) 0%,rgba(8,38,24,.62) 55%,rgba(8,38,24,.78) 100%),
    linear-gradient(100deg,rgba(8,38,24,.45),transparent 85%)}
}

/* photos ----------------------------------------------------------- */
.photo{display:block;width:100%;height:100%;object-fit:cover}

/* problem ---------------------------------------------------------- */
.pstats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:clamp(44px,6vw,68px)}
@media(max-width:720px){.pstats{grid-template-columns:1fr}}
.pstat{display:flex;flex-direction:column;gap:7px;height:100%;transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}
.pstat:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.pstat__ic{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:rgba(34,197,94,.12);color:var(--primary-deep);margin-bottom:4px;
  animation:pstatPulse 3.4s ease-in-out infinite;transition:transform .3s cubic-bezier(.22,1,.36,1)}
.pstat:nth-child(2) .pstat__ic{animation-delay:.55s}
.pstat:nth-child(3) .pstat__ic{animation-delay:1.1s}
.pstat:hover .pstat__ic{transform:scale(1.08)}
.pstat__ic svg{animation:pstatFloat 3.4s ease-in-out infinite}
.pstat:nth-child(2) .pstat__ic svg{animation-delay:.55s}
.pstat:nth-child(3) .pstat__ic svg{animation-delay:1.1s}
@keyframes pstatPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.22),0 0 0 0 rgba(34,197,94,.12)}
  50%{box-shadow:0 0 0 7px rgba(34,197,94,0),0 0 0 14px rgba(34,197,94,0)}}
@keyframes pstatFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.pstat__n{font-size:clamp(34px,4.5vw,44px);font-weight:800;color:var(--forest);line-height:1;display:flex;align-items:baseline;gap:3px}
.pstat__approx{font-size:.55em;color:var(--muted);font-weight:700}
.pstat__l{font-size:14.5px;font-weight:700;color:var(--ink)}
.pstat__s{font-size:13px;color:var(--muted)}
.problem__barriers-head{text-align:center;margin-bottom:26px}
.problem__barriers-head h3{font-size:22px;font-weight:800;color:var(--forest);margin:0 0 4px;letter-spacing:-.02em}
.barrier{display:flex;flex-direction:column;height:100%;padding:0;overflow:hidden}
.barrier__media{position:relative;aspect-ratio:16/10;overflow:hidden}
.barrier__media .photo{transition:transform .6s cubic-bezier(.22,1,.36,1)}
.barrier:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg)}
.barrier:hover .barrier__media .photo{transform:scale(1.05)}
.barrier{transition:.2s}
.barrier:hover{border-color:var(--primary)}
.barrier__body{padding:20px;display:flex;flex-direction:column;gap:8px;flex:1}
.barrier__t{font-size:17px;font-weight:800;color:var(--forest);margin:0}
.barrier__d{font-size:14px;color:var(--ink-2);margin:0}
.barrier__src{display:inline-flex;align-items:center;gap:5px;margin-top:auto;padding-top:6px;
  font-size:13px;font-weight:700;color:var(--primary-deep)}
.barrier__src svg{transition:transform .2s}
.barrier:hover .barrier__src svg{transform:translate(2px,-2px)}

/* how it works — step flow ----------------------------------------- */
.flow{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:8px}
.flow__rail{position:absolute;top:46px;left:16.66%;right:16.66%;height:2px;z-index:0;
  background:repeating-linear-gradient(90deg,rgba(34,197,94,.32) 0 7px,transparent 7px 16px);overflow:visible}
.flow__pulse{position:absolute;top:-3px;left:0;width:120px;height:8px;border-radius:8px;
  background:radial-gradient(closest-side,rgba(245,197,24,.9),rgba(245,197,24,0));filter:blur(1px);
  animation:flowPulse 3.6s cubic-bezier(.45,0,.55,1) infinite}
@keyframes flowPulse{0%{left:-120px;opacity:0}12%{opacity:1}88%{opacity:1}100%{left:100%;opacity:0}}
.flowstep{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px}
.flowstep__badge{position:relative;display:grid;place-items:center;height:92px;width:100%}
.flowstep__num{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:78px;font-weight:800;
  line-height:1;letter-spacing:-.05em;color:rgba(34,197,94,.08);pointer-events:none;z-index:-1}
.flowstep__ic{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 35%,#fff,#f1fbf4);color:var(--primary-deep);
  border:1.5px solid rgba(34,197,94,.35);
  box-shadow:0 0 0 8px rgba(34,197,94,.06),0 0 0 16px rgba(34,197,94,.04),0 14px 30px -14px rgba(22,163,74,.5);
  animation:badgeGlow 4s ease-in-out infinite}
.flowstep:nth-child(3) .flowstep__ic{animation-delay:.6s}
.flowstep:nth-child(4) .flowstep__ic{animation-delay:1.2s}
@keyframes badgeGlow{0%,100%{box-shadow:0 0 0 8px rgba(34,197,94,.06),0 0 0 16px rgba(34,197,94,.04),0 14px 30px -14px rgba(22,163,74,.45)}
  50%{box-shadow:0 0 0 10px rgba(34,197,94,.1),0 0 0 20px rgba(34,197,94,.05),0 16px 32px -14px rgba(22,163,74,.6)}}
.flowstep__body{display:flex;flex-direction:column;align-items:center;gap:4px}
.flowstep__t{font-size:19px;font-weight:800;color:var(--forest);margin:4px 0 0}
.flowstep__d{font-size:14.5px;color:var(--ink-2);margin:0;max-width:300px}
@media(max-width:760px){
  /* vertical timeline with downward energy flow */
  .flow{grid-template-columns:1fr;gap:34px;max-width:460px;margin-inline:auto}
  .flow__rail{display:none}
  .flowstep{flex-direction:row;align-items:flex-start;text-align:left;gap:18px}
  .flowstep__badge{height:auto;width:64px;flex:none}
  .flowstep__num{font-size:60px}
  .flowstep__body{align-items:flex-start;padding-top:8px}
  .flowstep__d{max-width:none}
  .flowstep:not(:last-child)::after{content:"";position:absolute;left:31px;top:74px;bottom:-38px;width:2px;
    background-image:repeating-linear-gradient(180deg,rgba(34,197,94,.6) 0 6px,transparent 6px 15px);
    background-size:2px 21px;animation:railFlowV 1.1s linear infinite}
}
@keyframes railFlowV{to{background-position:0 21px}}

/* two ways to take part -------------------------------------------- */
.roles__grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:clamp(48px,7vw,80px)}
.rolecard{display:flex;flex-direction:column;align-items:stretch;transition:.25s;padding:0;overflow:hidden;height:100%}
.rolecard:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.rolecard__content{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:11px;padding:clamp(24px,2.6vw,34px)}
.rolecard__t{font-size:21px;font-weight:800;color:var(--forest);margin:4px 0 0}
.rolecard__d{font-size:14.5px;color:var(--ink-2);margin:0}
.rolecard__feats{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
.rolecard__feats li{display:flex;gap:9px;align-items:flex-start;font-size:14.5px;color:var(--ink-2)}
.rolecard__feats svg{color:var(--primary);flex:none;margin-top:3px}

/* animated visual panel (replaces the photo) ----------------------- */
.roleviz{position:relative;overflow:hidden;width:100%;flex:none;min-height:248px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:30px}
.roleviz--buy{background:linear-gradient(160deg,#e9faef,#f6fef9)}
.roleviz--share{background:linear-gradient(160deg,#fdf6e3,#eefaf0)}
.roleviz__glow{position:absolute;width:240px;height:240px;border-radius:50%;top:-50px;left:-50px;pointer-events:none;
  background:radial-gradient(circle,rgba(34,197,94,.22),transparent 70%);animation:vizGlow 7s ease-in-out infinite}
.roleviz--share .roleviz__glow{background:radial-gradient(circle,rgba(245,197,24,.28),transparent 70%);top:auto;bottom:-50px;left:auto;right:-50px}
@keyframes vizGlow{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(28px,22px) scale(1.18)}}
.roleviz__ic{width:74px;height:74px;border-radius:50%;display:grid;place-items:center;position:relative;z-index:1;
  background:radial-gradient(circle at 50% 35%,#fff,#f1fbf4);color:var(--primary-deep);border:1.5px solid rgba(34,197,94,.35);
  box-shadow:0 0 0 10px rgba(34,197,94,.06),0 0 0 20px rgba(34,197,94,.04),0 16px 32px -14px rgba(22,163,74,.5);
  animation:badgeGlow 4s ease-in-out infinite}
.roleviz--share .roleviz__ic{color:#9a7400;border-color:rgba(245,197,24,.45)}
.roleviz__stat{position:relative;z-index:1;width:min(230px,100%);display:flex;flex-direction:column;gap:2px;
  background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.8);border-radius:16px;padding:14px 16px;box-shadow:0 20px 44px -22px rgba(8,40,24,.5)}
.roleviz__cap{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.roleviz__val{font-size:25px;font-weight:800;color:var(--forest);line-height:1.1}
.roleviz__val small{font-size:12px;font-weight:600;color:var(--muted);margin-left:1px}
.roleviz__delta{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:var(--primary-deep)}
.spark{width:100%;height:30px;margin-top:6px;overflow:visible}
.spark__base{fill:none;stroke:rgba(34,197,94,.28);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.spark__flow{fill:none;stroke:var(--primary);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;
  stroke-dasharray:12 132;animation:sparkUp 2.2s linear infinite}
@keyframes sparkUp{from{stroke-dashoffset:144}to{stroke-dashoffset:0}}
@media(max-width:760px){
  .roles__grid{grid-template-columns:1fr}
  .roleviz{min-height:0;padding:34px 24px}
}

/* plans ------------------------------------------------------------ */
.plans{align-items:stretch;margin-top:8px}
.plan{display:flex;flex-direction:column;gap:9px;position:relative;height:100%}
.plan--hot{border-color:var(--primary);box-shadow:0 0 0 3px rgba(34,197,94,.16),var(--shadow);background:linear-gradient(180deg,#f0fbf3,#fff)}
.plan__tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:5px;
  background:linear-gradient(95deg,#22c55e,#16a34a);color:#fff;font-size:11px;font-weight:800;padding:5px 13px;border-radius:999px;white-space:nowrap;box-shadow:0 8px 16px -8px rgba(22,163,74,.7)}
.plan__name{font-weight:800;font-size:19px;color:var(--forest);margin-top:4px}
.plan__blurb{font-size:13px;color:var(--muted)}
.plan__price{font-size:34px;font-weight:800;color:var(--forest);margin:2px 0} .plan__price small{font-size:13px;color:var(--muted);font-weight:600}
.plan__feats{list-style:none;margin:4px 0 14px;padding:0;display:flex;flex-direction:column;gap:9px;flex:1}
.plan__feats li{display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:var(--ink-2)}
.plan__feats svg{color:var(--primary);flex:none;margin-top:2px}

/* pillars / founder ------------------------------------------------ */
.pillar{display:flex;flex-direction:column;height:100%;padding:0;overflow:hidden;transition:.2s}
.pillar:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.pillar__media{aspect-ratio:16/10;overflow:hidden}
.pillar__media .photo{transition:transform .6s cubic-bezier(.22,1,.36,1)}
.pillar:hover .pillar__media .photo{transform:scale(1.05)}
.pillar__body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:9px;flex:1}
.pillar__head{display:flex;align-items:center;gap:11px}
.pillar__ic{width:38px;height:38px;border-radius:11px;flex:none;display:grid;place-items:center;background:rgba(34,197,94,.12);color:var(--primary-deep)}
.pillar__t{font-size:18px;font-weight:800;color:var(--forest);margin:0}
.pillar__d{font-size:14px;color:var(--ink-2);margin:0}
.pillar__more{display:inline-flex;align-items:center;gap:5px;margin-top:auto;padding-top:4px;font-size:13px;font-weight:700;color:var(--primary-deep)}
.pillar__more svg{transition:transform .2s}
.pillar:hover .pillar__more svg{transform:translate(2px,-2px)}

.founder{display:flex;gap:0;align-items:stretch;background:linear-gradient(135deg,#f1fbf4,#fff);overflow:hidden;padding:0}
.founder__media{position:relative;width:calc((100% - 36px) / 3);flex:none;align-self:stretch;overflow:hidden;min-height:440px}
.founder__media .photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top}
.founder__body{flex:1;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:clamp(30px,4vw,52px) clamp(30px,4vw,56px)}
.founder__q{color:var(--primary);opacity:.7}
.founder__quote{font-size:clamp(17px,1.9vw,23px);line-height:1.45;font-weight:700;letter-spacing:-.01em;font-style:italic;color:var(--forest);margin:0}
.founder__person{display:flex;flex-direction:column;align-items:flex-start;gap:5px;margin-top:8px}
.founder__name{font-size:17px;font-weight:800;color:var(--forest)}
.founder__role{font-size:14px;color:var(--muted);font-weight:600}
.founder__link{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--primary-deep);
  background:rgba(34,197,94,.1);padding:9px 15px;border-radius:12px;transition:.18s;margin-top:8px}
.founder__link:hover{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
@media(max-width:680px){
  .founder{flex-direction:column;align-items:stretch;text-align:left}
  .founder__media{width:100%;min-height:0;aspect-ratio:4/5}
  .founder__body{padding:28px 24px 30px}
}

/* partners --------------------------------------------------------- */
.partners__lead{margin-bottom:26px} .partners__lead p{margin:0;font-size:16px;line-height:1.6}
.partners__lead strong{font-weight:800}
.partner{display:flex;flex-direction:column;gap:9px}
.partner__ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(34,197,94,.12);color:var(--primary-deep)}
.partner__t{font-size:16px;font-weight:800;color:var(--forest);margin:0}
.partner__d{font-size:14px;color:var(--ink-2);margin:0}
.footnote{font-size:12.5px;color:var(--muted);margin:24px auto 0;max-width:720px;text-align:center;font-style:italic}

/* recognition ------------------------------------------------------ */
.awards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:stretch}
@media(max-width:860px){.awards{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.awards{grid-template-columns:1fr}}
.awards .reveal{height:100%}
.award{display:flex;flex-direction:column;height:100%;padding:0;overflow:hidden;transition:.2s;cursor:pointer}
.award:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:var(--primary)}
.award__media{aspect-ratio:16/10;overflow:hidden;flex:none}
.award__media .photo{transition:transform .6s cubic-bezier(.22,1,.36,1)}
.award:hover .award__media .photo{transform:scale(1.05)}
.award__body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:10px;align-items:flex-start;flex:1}
.award__head{display:flex;align-items:center;gap:10px}
.award__ic{width:34px;height:34px;border-radius:10px;flex:none;display:grid;place-items:center;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#9a7400}
.award__name{font-size:15.5px;font-weight:800;color:var(--forest);line-height:1.2}
.award__desc{font-size:13.5px;color:var(--ink-2);margin:0;line-height:1.5}
.award__more{display:inline-flex;align-items:center;gap:5px;margin-top:auto;padding-top:6px;font-size:13px;font-weight:700;color:var(--primary-deep)}
.award__more:hover{color:var(--forest)}
.award__more svg{transition:transform .2s}
.award:hover .award__more svg{transform:translate(2px,-2px)}

/* modal / lightbox (LinkedIn post) --------------------------------- */
.modal{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:20px;
  background:rgba(8,40,24,.55);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);animation:mfade .22s ease both}
@keyframes mfade{from{opacity:0}to{opacity:1}}
.modal__panel{width:100%;max-width:560px;max-height:90vh;overflow:auto;background:var(--surface);border:1px solid var(--line);
  border-radius:22px;box-shadow:var(--shadow-lg);animation:mpop .3s cubic-bezier(.22,1,.36,1) both}
@keyframes mpop{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
.modal__bar{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:16px 18px;background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--line);z-index:1}
.modal__title{font-size:15.5px;color:var(--forest);font-weight:800}
.modal__x{width:34px;height:34px;border-radius:11px;flex:none;display:grid;place-items:center;background:rgba(34,197,94,.1);color:var(--primary-deep);transition:.18s}
.modal__x:hover{background:rgba(34,197,94,.18)}
.modal__li{display:flex;flex-direction:column;gap:14px;padding:16px}
.modal__frame{width:100%;height:min(560px,70vh);border:0;border-radius:14px;background:#f1fbf4}
.modal__lilink{display:inline-flex;align-items:center;gap:8px;align-self:center;font-size:14px;font-weight:700;color:var(--primary-deep);
  background:rgba(34,197,94,.1);padding:10px 16px;border-radius:12px;transition:.18s}
.modal__lilink:hover{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}

/* accordion -------------------------------------------------------- */
.acc{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
@media(max-width:760px){.acc{grid-template-columns:1fr}}
.accitem{padding:0;overflow:hidden}
.accitem__h{margin:0}
.accitem__head{display:flex;align-items:center;gap:12px;width:100%;padding:18px 20px;text-align:left}
.accitem__icon{width:36px;height:36px;border-radius:10px;flex:none;display:grid;place-items:center;background:rgba(34,197,94,.12);color:var(--primary-deep);transition:.2s}
.accitem--open .accitem__icon{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
.accitem__title{flex:1;font-weight:700;font-size:16px;color:var(--forest)}
.accitem__chev{color:var(--muted);transition:transform .3s} .accitem--open .accitem__chev{transform:rotate(180deg);color:var(--primary-deep)}
.accitem__wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s cubic-bezier(.22,1,.36,1)}
.accitem--open .accitem__wrap{grid-template-rows:1fr}
.accitem__body{overflow:hidden;padding:0 20px;font-size:15px;color:var(--ink-2)}
.accitem--open .accitem__body{padding:0 20px 20px}
.accitem__body p{margin:0;line-height:1.6} .accitem__body b{color:var(--forest)}

/* fields ----------------------------------------------------------- */
.field{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid var(--line);background:#fbfefb;font-size:15px;font-family:inherit;transition:.18s}
.field:focus{outline:none;border-color:var(--primary);background:#fff;box-shadow:0 0 0 3px rgba(34,197,94,.12)}
.field::placeholder{color:#9bb0a4}

/* cta / waitlist --------------------------------------------------- */
.cta{position:relative;overflow:hidden;padding:clamp(32px,4vw,56px) clamp(26px,4vw,56px);color:#fff;border-color:transparent;
  background:linear-gradient(125deg,#15803d 0%,#16a34a 48%,#22c55e 100%);box-shadow:0 26px 60px -28px rgba(22,163,74,.7)}
.cta__glow{position:absolute;top:-50%;right:-4%;width:min(560px,70%);height:520px;border-radius:50%;
  background:radial-gradient(circle,rgba(245,197,24,.26),transparent 62%);pointer-events:none;z-index:0}
.cta>*:not(.cta__glow){position:relative;z-index:1}
.cta__row{display:flex;align-items:center;justify-content:space-between;gap:clamp(28px,5vw,64px)}
.cta__text{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.cta__action{flex:none;width:min(440px,100%)}
.cta__eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:#eafff1;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);
  padding:6px 13px;border-radius:999px}
.cta__h{font-size:clamp(26px,3vw,38px);font-weight:800;letter-spacing:-.03em;line-height:1.08;margin:2px 0 0}
.cta__sub{font-size:clamp(14.5px,1.4vw,16.5px);color:rgba(255,255,255,.92);margin:0;max-width:520px;line-height:1.5}
.cta__form{display:flex;flex-direction:column;gap:11px;width:100%}
.cta__field{width:100%;border:none;background:#fff;border-radius:13px;padding:16px 18px;font-family:inherit;
  font-size:15.5px;color:var(--ink);outline:none;box-shadow:0 16px 38px -22px rgba(8,40,24,.6)}
.cta__field::placeholder{color:#9bb0a4}
.cta__field:focus{box-shadow:0 0 0 3px rgba(255,255,255,.55),0 16px 38px -22px rgba(8,40,24,.6)}
.cta__form .cta__btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;border:none;
  font-family:inherit;font-weight:800;font-size:15px;color:#16a34a;padding:16px 20px;border-radius:13px;transition:.2s cubic-bezier(.4,0,.2,1);
  background:#ffffff;box-shadow:0 16px 32px -14px rgba(8,40,24,.55)}
.cta__form .cta__btn:hover{background:linear-gradient(95deg,#22c55e,#16a34a);color:#fff;transform:translateY(-2px);box-shadow:0 22px 40px -16px rgba(8,40,24,.6)}
.cta__form .cta__btn:active{transform:translateY(0)}
.cta__form .cta__btn[disabled]{opacity:.7;cursor:not-allowed}
.cta__form .cta__btn svg{transition:transform .2s}
.cta__form .cta__btn:hover svg{transform:translateX(3px)}
.cta__msg{font-size:13px;font-weight:600;color:#fff;background:rgba(0,0,0,.18);margin:10px 0 0;padding:8px 14px;border-radius:10px}
.cta__done{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:16px;padding:18px 20px}
.cta__check{width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;background:rgba(255,255,255,.2);color:#fff}
.cta__done strong{display:block;font-size:16px} .cta__done span{font-size:13.5px;color:rgba(255,255,255,.88)} .cta__done b{color:#fff}
@media(max-width:760px){
  .cta__row{flex-direction:column;align-items:flex-start;gap:24px}
  .cta__action{width:100%}
}

/* footer ----------------------------------------------------------- */
.footer{border-top:1px solid var(--line);background:rgba(255,255,255,.5);padding:48px 0 28px;margin-top:20px}
.footer__grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px}
.footer__brand{display:inline-flex;align-items:center;gap:9px}
.footer__tag{font-size:14px;color:var(--ink-2);margin:12px 0 16px;max-width:300px}
.footer__linkedin{display:inline-flex;align-items:center;gap:9px;font-size:14px;font-weight:700;color:var(--primary-deep);
  background:rgba(34,197,94,.1);border:1px solid var(--line);padding:10px 16px;border-radius:12px;transition:.18s}
.footer__linkedin:hover{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border-color:transparent}
.footer__col{display:flex;flex-direction:column;gap:10px}
.footer__col h3{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 4px}
.footer__col a{font-size:14px;color:var(--ink-2);display:inline-flex;align-items:center;gap:7px;width:fit-content}
.footer__col a:hover{color:var(--primary-deep)}
.footer__base{margin-top:36px;padding-top:22px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.footer__disclaimer{font-size:12px;color:var(--muted);margin:0;line-height:1.5}
.footer__copy{font-size:12.5px;color:var(--ink-2);font-weight:600;margin:0}
@media(max-width:720px){.footer__grid{grid-template-columns:1fr;gap:28px}}

/* a11y ------------------------------------------------------------- */
.sc-root button:focus-visible,.sc-root a:focus-visible,.sc-root .field:focus-visible{outline:2px solid var(--primary);outline-offset:2px}

@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  .sc-root *{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important}
  .reveal{opacity:1!important;transform:none!important}
}
`;
