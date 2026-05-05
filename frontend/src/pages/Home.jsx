import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';

// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Logo from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';
import {
  HeartPulse, Stethoscope, ActivitySquare, Building2,
  ArrowRight, Phone, Mail, MapPin, Facebook, Twitter,
  Instagram, Linkedin, Star, ShieldCheck, Calendar,
  Users, CheckCircle, Zap, Award, Clock, ChevronDown,
  FlaskConical, FileText, CreditCard, MessageSquare
} from 'lucide-react';

/* ─────────────── useActiveSection ─────────────── */
function useActiveSection(count) {
  const [active, setActive] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight);
      setActive(Math.min(idx, count - 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  const goTo = useCallback((i) => {
    containerRef.current?.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' });
  }, []);

  return { containerRef, active, goTo };
}

/* ─────────────── Section wrapper ─────────────── */
function Page({ id, children, bg = 'white', className = '' }) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setEntered(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      data-entered={entered}
      className={`relative ${className}`}
      style={{
        height: '100vh',
        minHeight: '100vh',
        background: bg,
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        overflow: 'hidden',
      }}
    >
      {children}
    </section>
  );
}
function ProgramsCarousel() {
  const [active, setActive] = useState(2);
  const [expanded, setExpanded] = useState(null);
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 800;

  const programs = [
    {
      title: "Quality Sleep",
      desc: "7-9 hours of sleep boosts immunity and mental clarity.",
      details: "Adequate rest allows your body to flush out toxins, repair tissues, and consolidate memory. Create a distraction-free pre-sleep routine like reading, limit screen exposure an hour prior, and maintain a cool, dark room environment for an incredibly restorative sleep.",
      img: "/doc_sleep_1774984440347.png"
    },
    {
      title: "Heart Health",
      desc: "Daily cardio strengthens your heart and reduces stress.",
      details: "The American Heart Association stresses at least 150 minutes of moderate-intensity activity weekly. Brisk walking, swimming, or cycling regularly improves circulation, reduces bad cholesterol, and dramatically drops risks of severe cardiovascular incidents.",
      img: "/doc_heart_1774984457371.png"
    },
    {
      title: "Balanced Diet",
      desc: "Fuel your body with nutrient-rich whole foods.",
      details: "A nutrient-rich diet focuses tightly on high-quality proteins, essential fatty acids, and complex carbohydrates. Always prioritize fresh vegetables, whole grains, and lean meats. A colorful plate ensures a wide spectrum of vital micronutrients and antioxidants.",
      img: "/doc_diet_1774984471569.png"
    },
    {
      title: "Hydration Focus",
      desc: "Drinking sufficient water everyday promotes longevity.",
      details: "Water is the essential medium for human metabolic functions. Aiming for 8+ glasses per day not only maintains excellent skin elasticity and joint lubrication, but fundamentally prevents kidney stress, aids optimal digestion, and drastically improves daily energy levels.",
      img: "/doc_water_1774984487530.png"
    },
    {
      title: "Mental Wellness",
      desc: "Practice mindfulness to lower anxiety and find balance.",
      details: "Your psychological health directly impacts physical well-being. Regular mindfulness practices like meditation, deep-breathing exercises, or even daily journaling can profoundly reduce cortisol levels, allowing you to easily manage stress and process daily emotional burdens.",
      img: "/doc_mental_1774984509644.png"
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

      {/* 3D Carousel Container */}
      <div style={{ position: 'relative', height: isMobile ? 400 : 480, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 2000, marginBottom: isMobile ? 12 : 24, overflowX: 'hidden' }}>
        {programs.map((item, i) => {
          const offset = i - active;
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;

          let zTranslate = isActive ? 100 : -absOffset * 150;
          let xTranslate = offset * (isMobile ? 120 : 220);
          let scale = isActive ? 1 : 0.85;
          let opacity = isActive ? 1 : Math.max(0, 1 - absOffset * 0.4);
          let zIndex = 10 - absOffset;
          const isExpanded = expanded === i;

          return (
            <div
              key={i}
              onClick={() => {
                if (expanded !== null) setExpanded(null);
                if (!isActive) setActive(i);
              }}
              style={{
                position: 'absolute',
                transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                transform: `translateX(${xTranslate}px) translateZ(${zTranslate}px) scale(${scale})`,
                opacity,
                zIndex,
                cursor: isActive ? 'default' : 'pointer',
                width: isMobile ? 230 : 270,
                height: isActive ? (isMobile ? 340 : 400) : (isMobile ? 280 : 340),
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: isActive ? '0 30px 60px rgba(26,60,52,0.25)' : 'none',
                background: '#1A3C34',
                border: isActive ? 'none' : '1px solid rgba(26,60,52,0.1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* IMAGE TOP HALF */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#1A3C34' }}>
                <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isActive ? 1 : 0.5, transition: 'all 0.6s', filter: isActive ? 'none' : 'grayscale(100%) blur(1px)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(26,60,52,0) 50%, rgba(26,60,52,0.4) 100%)', mixBlendMode: 'multiply' }} />
              </div>

              {/* FOOTER DESCRIPTION */}
              <div style={{
                height: isMobile ? 96 : 112,
                background: isActive ? '#F5F2ED' : '#1A3C34',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 20px',
                transition: 'all 0.6s',
                borderTop: isActive ? 'none' : '1px solid rgba(255,255,255,0.06)'
              }}>
                <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: isActive ? '#1A3C34' : 'white', marginBottom: 4, letterSpacing: '-.02em', transition: 'color 0.6s' }}>{item.title}</h3>
                <div style={{ fontSize: isMobile ? 12 : 14, color: isActive ? '#3D7A68' : 'rgba(255,255,255,0.6)', lineHeight: 1.4, transition: 'color 0.6s' }}>
                  {item.desc}
                  {isActive && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setExpanded(i); }}
                      style={{ marginTop: 6, color: '#00C2A8', fontWeight: 800, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#3D7A68'}
                      onMouseLeave={e => e.currentTarget.style.color = '#00C2A8'}
                    >
                      Learn more <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* EXPANDED DETAILS OVERLAY */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(145deg, #1A3C34, #0D221B)',
                zIndex: 20,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                transform: isExpanded ? 'translateY(0)' : 'translateY(100%)',
                opacity: isExpanded ? 1 : 0,
                transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(null); }}
                  style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >✕</button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: '#00C2A8', letterSpacing: '-.02em' }}>{item.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>{item.details}</p>
                </div>
              </div>

            </div>
          )
        })}
      </div>

      {/* Pagination dots */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingBottom: isMobile ? 40 : 0 }}>
        {programs.map((_, i) => (
          <button key={i} onClick={() => { setActive(i); setExpanded(null); }} style={{ width: 10, height: 10, borderRadius: '50%', background: active === i ? '#1A3C34' : 'rgba(26,60,52,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', transform: active === i ? 'scale(1.3)' : 'scale(1)' }} />
        ))}
      </div>

    </div>
  )
}

const SECTIONS = ['home', 'services', 'features', 'programs', 'about', 'testimonials', 'contact'];

export default function Home() {
  const { isAuthenticated, userRole } = useAuth();
  const { containerRef, active, goTo } = useActiveSection(SECTIONS.length);

  // Define dashboard path based on role
  const getDashboardPath = () => {
    switch (userRole) {
      case 'ADMIN': return '/admin';
      case 'CLINIC': return '/clinic';
      case 'DOCTOR': return '/doctor';
      case 'LAB': return '/lab';
      default: return '/patient';
    }
  };

  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }

        :root {
          --dg:      #1A3C34;
          --dg-mid:  #2D5748;
          --dg-lite: #3D7A68;
          --cream:   #F5F2ED;
          --grey:    #B0BAC6;
          --grey-lt: #E2E6ED;
        }

        /* ── Scrollable container ── */
        #snap-container {
          height: 100vh;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        /* Hide scrollbar */
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── Shared animations ── */
        @keyframes fadeUp   { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:none; } }
        @keyframes fadeLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:none; } }
        @keyframes fadeRight{ from { opacity:0; transform:translateX( 40px); } to { opacity:1; transform:none; } }
        @keyframes scaleIn  { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
        @keyframes floatY   { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-12px); } }
        @keyframes shimmer  { 0%{ background-position:-200% center; } 100%{ background-position:200% center; } }
        @keyframes pulse-dot{ 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:.5; transform:scale(1.4); } }
        @keyframes spin     { to{ transform:rotate(360deg); } }
        @keyframes ping     { 75%,100%{ transform:scale(2); opacity:0; } }
        @keyframes gradient-x {
          0%,100% { background-position:0% 50%; }
          50%      { background-position:100% 50%; }
        }

        /* ── Triggered animations when section is entered ── */
        [data-entered='false'] .anim-fadeUp,
        [data-entered='false'] .anim-fadeLeft,
        [data-entered='false'] .anim-fadeRight,
        [data-entered='false'] .anim-scaleIn { opacity:0; }

        [data-entered='true'] .anim-fadeUp  { animation: fadeUp   0.7s ease both; }
        [data-entered='true'] .anim-fadeLeft{ animation: fadeLeft 0.7s ease both; }
        [data-entered='true'] .anim-fadeRight{animation: fadeRight 0.7s ease both; }
        [data-entered='true'] .anim-scaleIn { animation: scaleIn  0.6s ease both; }

        /* delay helpers */
        .d1 { animation-delay:  100ms; }
        .d2 { animation-delay:  220ms; }
        .d3 { animation-delay:  340ms; }
        .d4 { animation-delay:  460ms; }
        .d5 { animation-delay:  580ms; }
        .d6 { animation-delay:  700ms; }

        .float { animation: floatY 5s ease-in-out infinite; }
        .float2{ animation: floatY 7s ease-in-out infinite 1s; }

        /* ── Grey shimmer text ── */
        .shimmer-gold {
          background: linear-gradient(90deg, #7A9E94, #3D7A68, #1A3C34, #3D7A68);
          background-size:300% auto;
          background-clip:text;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          animation: shimmer 3.5s linear infinite;
        }

        /* ── Buttons ── */
        .btn-dark {
          display:inline-flex; align-items:center; gap:8px;
          background: linear-gradient(135deg, var(--dg), var(--dg-mid));
          color:white; font-weight:700; border-radius:999px;
          border:1px solid rgba(255,255,255,0.12);
          box-shadow: 0 8px 28px rgba(26,60,52,0.32);
          transition: transform .25s, box-shadow .25s;
          cursor:pointer; text-decoration:none;
        }
        .btn-dark:hover { transform:translateY(-2px); box-shadow:0 14px 36px rgba(26,60,52,0.42); }

        .btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          background:white; color:var(--dg); font-weight:700; border-radius:999px;
          border:1.5px solid rgba(26,60,52,0.18);
          box-shadow:0 4px 16px rgba(26,60,52,0.06);
          transition: transform .25s, box-shadow .25s;
          cursor:pointer; text-decoration:none;
        }
        .btn-outline:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(26,60,52,0.12); }

        .btn-grey {
          display:inline-flex; align-items:center; gap:8px;
          background: linear-gradient(135deg, #CBD3DB, #A8B3BE);
          color:#1A3C34; font-weight:800; border-radius:999px;
          box-shadow:0 12px 32px rgba(140,155,170,0.35);
          transition: transform .25s, box-shadow .25s;
          cursor:pointer; text-decoration:none;
        }
        .btn-grey:hover { transform:translateY(-2px); box-shadow:0 18px 40px rgba(140,155,170,0.45); }

        /* ── Glass cards ── */
        .glass {
          background:rgba(255,255,255,0.85);
          backdrop-filter:blur(18px);
          border:1px solid rgba(255,255,255,0.55);
          border-radius:20px;
        }
        .glass-dark {
          background:rgba(26,60,52,0.65);
          backdrop-filter:blur(18px);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:20px;
        }

        /* ── Service cards ── */
        .svc-card {
          background: var(--dg);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          overflow:hidden;
          position:relative;
          transition: transform .35s cubic-bezier(.175,.885,.32,1.275), box-shadow .35s;
          cursor:pointer;
        }
        .svc-card::before {
          content:''; position:absolute; inset:0;
          background: linear-gradient(140deg, var(--dg), var(--dg-mid));
          opacity:0; transition:opacity .35s;
        }
        .svc-card:hover { transform:translateY(-10px); box-shadow:0 28px 56px rgba(26,60,52,0.16); }
        .svc-card:hover::before { opacity:1; }
        .svc-card > * { position:relative; z-index:1; }
        .svc-card:hover .svc-icon-wrap { background:rgba(255,255,255,0.15); }
        .svc-card:hover .svc-title     { color: #F5F2ED; }
        .svc-card:hover .svc-desc      { color: rgba(255,255,255,0.75); }
        .svc-card:hover .svc-link      { color: #00C2A8; }
        .svc-card:hover .svc-img       { transform: scale(1.1); }
        .svc-card:hover .svc-arrow     { transform: translateX(4px); }

        /* ── Testimonial cards ── */
        .testi-card {
          background:white;
          border:1px solid rgba(26,60,52,0.06);
          border-radius:24px;
          transition: transform .3s, box-shadow .3s;
        }
        .testi-card:hover { transform:translateY(-6px); box-shadow:0 20px 44px rgba(26,60,52,0.1); }

        /* ── Nav dots ── */
        .nav-dot {
          width:8px; height:8px; border-radius:50%;
          background:rgba(26,60,52,0.2);
          transition: all .3s;
          cursor:pointer; border:none; outline:none;
        }
        .nav-dot.active { background:var(--dg); transform:scale(1.4); }

        /* ── Section pill ── */
        .pill {
          display:inline-flex; align-items:center; gap:8px;
          padding:6px 16px; border-radius:999px; font-size:11px; font-weight:700;
          letter-spacing:.1em; text-transform:uppercase;
        }

        /* ── Divider ── */
        .divider {
          width: 52px; height: 4px; border-radius: 4px;
          background: linear-gradient(90deg,var(--dg),var(--grey));
        }

        /* ── Plus Grid Background ── */
        .plus-grid {
          background-image: 
            radial-gradient(var(--teal-accent) 0.5px, transparent 0.5px),
            radial-gradient(var(--teal-accent) 0.5px, transparent 0.5px);
          background-size: 40px 40px;
          background-position: 0 0, 20px 20px;
          opacity: 0.08;
        }

        /* ── Feature Card ── */
        .feat-card {
          background: white;
          border-radius: 32px;
          padding: 40px;
          border: 1px solid rgba(26,60,52,0.05);
          box-shadow: 0 10px 30px -10px rgba(26,60,52,0.04);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }
        .feat-card:hover {
          transform: translateY(-12px);
          box-shadow: 0 30px 60px -15px rgba(26,60,52,0.12);
          border-color: rgba(0, 201, 177, 0.2);
        }
        .feat-icon-box {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: #00C9B1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: transform 0.4s ease;
        }
        .feat-card:hover .feat-icon-box {
          transform: scale(1.1) rotate(5deg);
        }
        .feat-card:hover .feat-icon-anim {
          animation: floatY 3s ease-in-out infinite;
        }

        /* ── Workflow Timeline ── */
        .timeline-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          width: 100%;
          margin-top: 40px;
        }
        .timeline-line {
          position: absolute;
          top: 40px; /* half of 80px icon */
          left: 5%;
          right: 5%;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          z-index: 0;
        }
        .timeline-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #3D7A68, #00C2A8);
          border-radius: 4px;
          transition: width 1.5s cubic-bezier(0.25, 1, 0.5, 1) 0.5s;
        }
        [data-entered='true'] .timeline-progress {
          width: 100%;
          animation: lineGlowPulse 2.5s ease-in-out infinite alternate 1.5s; /* starts after fill transition */
        }
        @keyframes lineGlowPulse {
          0% { box-shadow: 0 0 4px rgba(0, 194, 168, 0.3); filter: brightness(1); }
          100% { box-shadow: 0 0 16px rgba(0, 194, 168, 0.8), 0 0 4px rgba(255,255,255,0.4) inset; filter: brightness(1.2); }
        }
        .timeline-step {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
          gap: 16px;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .timeline-step:hover {
          transform: translateY(-12px);
        }
        .timeline-icon {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: #F5F2ED;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 12px 24px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease;
          position: relative;
        }
        .timeline-step:hover .timeline-icon {
          background: #00C2A8;
          border-color: #00C2A8;
          box-shadow: 0 20px 40px rgba(0,194,168,0.3);
        }
        .timeline-step:hover .t-icon-svg {
          color: #1A3C34 !important;
        }
        .timeline-title {
          font-size: 15px;
          font-weight: 800;
          color: white;
          margin-bottom: 6px;
        }
        .timeline-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          max-width: 140px;
          line-height: 1.5;
        }
        .timeline-step-num {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #3D7A68;
          color: white;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(61,122,104,0.25);
          transition: all 0.3s;
        }
        .timeline-step:hover .timeline-step-num {
          transform: scale(1.15) rotate(10deg);
          background: #00C2A8;
        }

        @media (max-width: 900px) {
          .timeline-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
            padding-left: 20px;
            margin-top: 10px;
          }
          .timeline-line {
            top: 0;
            bottom: 0;
            left: 60px; /* 20px padding-left + 40px half icon width */
            width: 4px;
            height: 100%;
            right: auto;
          }
          .timeline-progress {
            height: 0%;
            width: 100%;
            transition: height 1.5s cubic-bezier(0.25, 1, 0.5, 1) 0.5s;
          }
          [data-entered='true'] .timeline-progress {
            width: 100%;
            height: 100%;
          }
          .timeline-step {
            flex-direction: row;
            text-align: left;
            width: 100%;
            gap: 24px;
            padding: 24px 0;
          }
          .timeline-step:hover {
            transform: translateX(12px);
          }
          .timeline-desc {
            max-width: none;
          }
          .workflow-mobile-img {
            display: block !important;
          }
        }
      `}</style>

      {/* ──────────── NAVBAR (fixed, always on top) ──────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 48px',
        background: active === 0 ? 'transparent' : 'rgba(245,242,237,0.92)',
        backdropFilter: active === 0 ? 'none' : 'blur(20px)',
        borderBottom: active === 0 ? 'none' : '1px solid rgba(26,60,52,0.08)',
        transition: 'all .35s ease',
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size="md" variant="dark" />
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: 36 }}>
          {SECTIONS.slice(0, 6).map((s, i) => (
            <button
              key={s}
              onClick={() => goTo(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, letterSpacing: '.01em',
                color: active === i ? '#1A3C34' : 'rgba(26,60,52,0.55)',
                textTransform: 'capitalize',
                borderBottom: active === i ? '2px solid #1A3C34' : '2px solid transparent',
                paddingBottom: 2, transition: 'all .2s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn-outline" style={{ padding: '10px 22px', fontSize: 14 }}>Login</Link>
              <Link to="/register" className="btn-dark" style={{ padding: '10px 22px', fontSize: 14 }}>
                Get Started <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <Link to={getDashboardPath()} className="btn-dark" style={{ padding: '10px 22px', fontSize: 14 }}>
              Dashboard <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </nav>

      {/* ──────────── SIDE NAV DOTS ──────────── */}
      <div style={{
        position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
        zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            onClick={() => goTo(i)}
            className={`nav-dot ${active === i ? 'active' : ''}`}
            title={s}
          />
        ))}
      </div>

      {/* ──────────── SCROLL CONTAINER ──────────── */}
      <div id="snap-container" ref={containerRef}>

        {/* ══════════ PAGE 1 — HERO ══════════ */}
        <Page id="home" bg="linear-gradient(160deg, #F5F2ED 0%, #E6EFE9 45%, #F5F2ED 100%)">
          {/* dot-grid bg */}
          <div style={{
            position: 'absolute', inset: 0, opacity: .18,
            backgroundImage: 'radial-gradient(circle,#1A3C34 1px,transparent 1px)',
            backgroundSize: '38px 38px',
          }} />
          {/* glow */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(26,60,52,0.08),transparent 70%)', pointerEvents: 'none' }} />

          <div style={{
            position: 'relative', zIndex: 1, height: '100%',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            alignItems: 'center', gap: 64,
            padding: '80px 64px 40px',
            maxWidth: 1280, margin: '0 auto',
          }}>
            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              <div className="anim-fadeUp pill" style={{ background: 'rgba(26,60,52,0.07)', border: '1px solid rgba(26,60,52,0.12)', color: '#1A3C34', width: 'fit-content' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3D7A68', display: 'inline-block', position: 'relative' }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3D7A68', animation: 'ping 1.5s cubic-bezier(0,0,.2,1) infinite' }} />
                </span>
                Next-Gen Healthcare Platform
              </div>

              <div className="anim-fadeUp d1">
                <h1 style={{ fontSize: 'clamp(48px,5vw,72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-.03em', color: '#1A3C34' }}>
                  careN
                </h1>
                <h1 className="shimmer-gold" style={{ fontSize: 'clamp(48px,5vw,72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-.03em' }}>
                  connect
                </h1>
                <p style={{ fontSize: 'clamp(20px,2vw,28px)', fontWeight: 700, color: 'rgba(26,60,52,0.45)', marginTop: 12, letterSpacing: '-.01em' }}>
                  Multi-Category <span style={{ color: '#1A3C34' }}>Healthcare Setup</span>
                </p>
              </div>

              <p className="anim-fadeUp d2" style={{ fontSize: 17, lineHeight: 1.7, color: '#4A6A60', maxWidth: 420 }}>
                Book appointments at top-tier clinics, doctors, and diagnostic labs — all from one simple platform.
              </p>

              <div className="anim-fadeUp d3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/find-doctors" className="btn-dark" style={{ padding: '14px 32px', fontSize: 16 }}>
                  Start Booking <ArrowRight size={18} />
                </Link>
                <button onClick={() => goTo(1)} className="btn-outline" style={{ padding: '14px 32px', fontSize: 16 }}>
                  See Services
                </button>
              </div>

              <div className="anim-fadeUp d4" style={{ display: 'flex', gap: 32, paddingTop: 16, borderTop: '1px solid rgba(26,60,52,0.1)' }}>
                {[['Verified', 'Partners'], ['Instant', 'Sync'], ['Secured', 'Data']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1A3C34', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={16} color="#3D7A68" /> {v}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#7A9E94', textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Professional Image UI */}
            <div className="anim-fadeRight d1" style={{ position: 'relative', perspective: 1200 }}>
              {/* Tilted background glow */}
              <div style={{
                position: 'absolute', inset: '-10%', borderRadius: '50%',
                background: 'radial-gradient(circle,rgba(61,122,104,0.12),transparent 70%)',
                zIndex: 0, pointerEvents: 'none'
              }} />

              {/* Main Professional UI Card */}
              <div style={{
                position: 'relative', width: '100%', height: 540,
                borderRadius: 48, overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 50px 100px -20px rgba(26, 60, 52, 0.45)',
                transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                zIndex: 1,
                cursor: 'default',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-12px) rotateX(4deg) rotateY(-4deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                {/* Generated Real-World Healthcare Image */}
                <img
                  src="/green_white_doctor.png"
                  alt="careNconnect Clinic"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }}
                />



                {/* Active Session chip */}
                <div style={{ position: 'absolute', top: 24, right: 24, padding: '6px 14px', background: 'rgba(26,60,52,0.85)', backdropFilter: 'blur(8px)', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 10px #4ADE80' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '.06em' }}>Live Platform</span>
                </div>

                {/* Bottom Stats Row */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, background: 'linear-gradient(to top, rgba(26,60,52,0.9), transparent)' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="glass" style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Network</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Active <span style={{ fontSize: 12, fontWeight: 500, color: '#4ADE80' }}>24/7</span></div>
                    </div>
                    <div className="glass" style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Reliability</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>99.9% <span style={{ fontSize: 12, fontWeight: 500, color: '#B0BAC6' }}>Secure</span></div>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* Scroll hint */}
          <button onClick={() => goTo(1)} style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'fadeUp 1s ease 1.5s both' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: 'rgba(26,60,52,0.4)', textTransform: 'uppercase' }}>Scroll</span>
            <ChevronDown size={20} color="rgba(26,60,52,0.35)" style={{ animation: 'floatY 2s ease-in-out infinite' }} />
          </button>
        </Page>

        {/* ══════════ PAGE 2 — SERVICES ══════════ */}
        <Page id="services" bg="#F5F2ED">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 48px 60px', maxWidth: 1100, margin: '0 auto' }}>
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div className="divider" style={{ margin: '0 auto 14px' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: '#3D7A68', textTransform: 'uppercase' }}>What We Offer</span>
                <h2 style={{ fontSize: 'clamp(28px,3.2vw,44px)', fontWeight: 900, color: '#1A3C34', marginTop: 14, letterSpacing: '-.02em' }}>
                  All Healthcare, <span style={{ color: 'transparent', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #1A3C34 0%, #00C2A8 100%)' }}>One Platform.</span>
                </h2>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { icon: Building2, title: 'Clinics', desc: 'Instant access to verified multi-specialty clinics. Book, manage, and track your consultations in real-time.', cta: 'Book Clinic', img: '/green_white_clinic.png', link: '/find-clinics' },
                { icon: Stethoscope, title: 'Specialist Doctors', desc: 'Board-certified doctors across 40+ specialties. View profiles, ratings, and availability in seconds.', cta: 'Find Doctor', img: '/green_white_patient.png', link: '/find-doctors' },
                { icon: ActivitySquare, title: 'Diagnostic Labs', desc: 'Schedule lab tests online, receive digital results straight to your secure patient portal.', cta: 'Book Lab Test', img: '/green_white_lab.png', link: '/find-tests' },
                // eslint-disable-next-line no-unused-vars
              ].map(({ icon: Icon, title, desc, cta, img, link }, i) => (
                <motion.div
                  key={title}
                  initial={{
                    opacity: 0,
                    x: i === 0 ? -100 : (i === 2 ? 100 : 0),
                    y: i === 1 ? 100 : 0
                  }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, delay: i * 0.2, ease: [0.21, 1.11, 0.81, 0.99] }}
                  style={{ height: '100%' }}
                >
                  <Link
                    to={link}
                    style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                  >
                    <div className="svc-card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(26,60,52,0.1)', boxShadow: '0 10px 30px rgba(26,60,52,0.04)' }}>
                      <div style={{ height: 180, width: '100%', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={img}
                          alt={title}
                          className="svc-img"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: title.includes('Doctors') ? 'top center' : 'center',
                            transition: 'transform 0.8s'
                          }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(26,60,52,0.05) 100%)' }} />
                        <div className="svc-icon-wrap" style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>
                          <Icon size={20} className="svc-icon" color="#3D7A68" />
                        </div>
                      </div>

                      <div style={{ padding: '28px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C2A8' }} />
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#00C2A8', letterSpacing: '.15em', textTransform: 'uppercase' }}>Verified Service</span>
                        </div>

                        <h3 className="svc-title" style={{ fontSize: 22, fontWeight: 900, color: '#F5F2ED', marginBottom: 14, letterSpacing: '-.02em', transition: 'color 0.3s' }}>{title}</h3>
                        <p className="svc-desc" style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(245,242,237,0.65)', marginBottom: 28, flex: 1, transition: 'color 0.3s' }}>{desc}</p>

                        <div className="svc-link" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#00C2A8', textTransform: 'uppercase', letterSpacing: '.1em', transition: 'color 0.3s' }}>
                          {cta} <ArrowRight size={14} className="svc-arrow" style={{ transition: 'transform 0.3s' }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </Page>

        {/* ══════════ PAGE 3 — HOW IT WORKS (WORKFLOW) ══════════ */}
        <Page id="features" bg="linear-gradient(145deg, #1A3C34 0%, #0D221B 100%)">
          <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px 60px', maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>

            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div className="divider" style={{ margin: '0 auto 14px', background: 'linear-gradient(90deg, #00C2A8, rgba(255,255,255,0.1))' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: '#00C2A8', textTransform: 'uppercase' }}>Workflow</span>
                <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: 'white', marginTop: 10, letterSpacing: '-.02em' }}>
                  How it works
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 16, maxWidth: 500, margin: '16px auto 0' }}>
                  Experience a seamless journey from signing up to getting your consultation and digital reports instantly.
                </p>
              </div>
            </Reveal>

            <div className="workflow-wrapper" style={{ position: 'relative', width: '100%' }}>
              {/* Mobile specific green image box */}
              <Reveal>
                <div className="workflow-mobile-img" style={{ display: 'none' }}>
                  <div style={{ borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: 32, textAlign: 'center', marginBottom: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/green_white_patient.png" alt="Happy Patient" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity: 0.2 }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#00C2A8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '4px solid rgba(255,255,255,0.2)' }}>
                        <Zap size={32} color="white" />
                      </div>
                      <h3 style={{ color: 'white', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Your Health Journey</h3>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Seamless, secure, and fully digital.</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <div className="timeline-container">
                <div className="timeline-line">
                  <div className="timeline-progress"></div>
                </div>

                {[
                  { title: "Create Account", desc: "Sign up securely in minutes.", icon: Users },
                  { title: "Find Clinic / Labs", desc: "Search top-rated specialists or clinics.", icon: Stethoscope },
                  { title: "Book Appt", desc: "Select a convenient time slot.", icon: Calendar },
                  { title: "Get Confirmed", desc: "Receive instant notifications.", icon: CheckCircle },
                  { title: "Consultation", desc: "Visit clinic or consult online.", icon: MessageSquare },
                  { title: "Digital Reports", desc: "Access history seamlessly.", icon: FileText }
                ].map((step, i) => (
                  <Reveal key={i} delay={`d${i + 1}`}>
                    <div className="timeline-step">
                      <div className="timeline-icon">
                        <div className="timeline-step-num">{i + 1}</div>
                        <step.icon size={32} color="#00C2A8" className="t-icon-svg" style={{ transition: 'color 0.3s' }} />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title">{step.title}</div>
                        <div className="timeline-desc">{step.desc}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Page>

        {/* ══════════ PAGE 3.5 — PROGRAMS ══════════ */}
        <Page id="programs" bg="#F5F2ED">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 20px 40px', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div className="divider" style={{ margin: '0 auto 14px' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: '#3D7A68', textTransform: 'uppercase' }}>Wellness Guide</span>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, color: '#1A3C34', marginTop: 12, letterSpacing: '-.02em', lineHeight: 1.2 }}>
                  Essential <span style={{ color: 'transparent', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #1A3C34 0%, #00C2A8 100%)' }}>Health Insights</span> <span style={{ fontWeight: 400, color: '#5A7A70' }}>& Tips</span>
                </h2>
              </div>
            </Reveal>

            <ProgramsCarousel />
          </div>
        </Page>

        {/* ══════════ PAGE 4 — ABOUT ══════════ */}
        <Page id="about" bg="linear-gradient(150deg,#1A3C34 0%,#0F2920 100%)">
          {/* dot bg */}
          <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', alignItems: 'center', gap: 64, padding: '80px 64px 60px', maxWidth: 1280, margin: '0 auto' }}>

            {/* LEFT — medical image card (inspired by uploaded screenshot) */}
            <Reveal>
              <div style={{ position: 'relative', maxWidth: 540 }}>
                {/* Tilted bg slab */}
                <div style={{ position: 'absolute', inset: 12, borderRadius: 36, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', transform: 'rotate(-2deg)' }} />

                {/* Main image */}
                <div style={{
                  position: 'relative', borderRadius: 28, overflow: 'hidden',
                  height: 460, boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                  animation: 'floatY 6s ease-in-out infinite',
                }}>
                  <img
                    src="/green_white_patient.png"
                    alt="Healthcare consultation"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* dark overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(10,25,18,0.1) 0%,rgba(10,25,18,0.6) 100%)' }} />

                  {/* Bottom stats strip */}
                  <div style={{
                    position: 'absolute', bottom: 20, left: 20, right: 20,
                    background: 'rgba(8,20,14,0.85)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                    padding: '14px 20px', display: 'flex', justifyContent: 'space-around',
                  }}>
                    {[['Expert', 'Doctors'], ['Verified', 'Labs'], ['Secure', 'Access']].map(([v, l]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                          <CheckCircle size={12} color="#00C2A8" /> {v}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shield badge overlay — exactly like the screenshot */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  width: 100, height: 100, borderRadius: '50%',
                  background: '#00C2A8', // teal accent like screen
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(0,194,168,0.4)',
                  border: '4px solid #1A3C34',
                  zIndex: 2,
                }}>
                  <ShieldCheck size={44} color="white" />
                </div>


              </div>
            </Reveal>

            {/* RIGHT column — text and features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <Reveal>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h2 style={{ fontSize: 'clamp(38px,4.5vw,58px)', fontWeight: 900, color: 'white', lineHeight: 1.05, letterSpacing: '-.03em' }}>
                    Bridging the gap in<br />
                    <span style={{ color: '#B0BAC6' }}>health availability.</span>
                  </h2>
                </div>
              </Reveal>

              <Reveal>
                <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: 500 }}>
                  <span style={{ color: '#00C2A8', fontWeight: 700 }}>careNconnect</span> is an enterprise-grade medical orchestration platform. We engineered the ecosystem to eliminate wait times and fragmented data silos.
                </p>
              </Reveal>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: ActivitySquare, t: 'High-Fidelity Interaction', d: 'An interface designed for precision and clarity in every medical transaction.' },
                  { icon: ShieldCheck, t: 'Encryption Standard', d: 'Every appointment and record is secured within a private, AES-256 encrypted node.' },
                  // eslint-disable-next-line no-unused-vars
                ].map(({ icon: Icon, t, d }, i) => (
                  <Reveal key={t} delay={i === 0 ? 'd1' : 'd2'}>
                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'rgba(176,186,198,0.06)', border: '1.5px solid rgba(176,186,198,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={20} color="#00C2A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'white', letterSpacing: '.02em', marginBottom: 4 }}>{t}</div>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{d}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal>
                <Link to="/register" className="btn-grey" style={{ padding: '16px 40px', fontSize: 16, width: 'fit-content', marginTop: 8 }}>
                  Get Started Now <ArrowRight size={18} />
                </Link>
              </Reveal>
            </div>

          </div>
        </Page>

        {/* ══════════ PAGE 4 — TESTIMONIALS ══════════ */}
        <Page id="testimonials" bg="#F5F2ED">
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px 60px', maxWidth: 1280, margin: '0 auto' }}>
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div className="divider" style={{ margin: '0 auto 14px' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: '#3D7A68', textTransform: 'uppercase' }}>What People Say</span>
                <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: '#1A3C34', marginTop: 10, letterSpacing: '-.02em' }}>
                  Trusted by many
                </h2>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                {
                  name: 'albin', role: 'Patient', avatar: 'A',
                  text: 'careNconnect made booking my specialist appointment effortless. Everything just works — beautifully.', stars: 5
                },
                {
                  name: 'Dr. Anju Pol', role: 'Cardiologist', avatar: 'AP',
                  text: 'Managing my schedule and patient records has never been this seamless. A true game-changer for my practice.', stars: 5
                },
                {
                  name: 'MedWell Clinic', role: 'Partner Clinic', avatar: 'C',
                  text: 'Our patient management improved by 40% after joining careNconnect. Highly recommended!', stars: 5
                },
              ].map(({ name, role, text, stars }, i) => (
                <Reveal key={name} delay={i === 0 ? '' : i === 1 ? 'd2' : 'd4'}>
                  <div className="testi-card" style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                      {Array.from({ length: stars }).map((_, j) => <Star key={j} size={16} fill="#FBBF24" color="#FBBF24" />)}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: '#5A7A70', flex: 1, marginBottom: 24 }}>
                      &ldquo;{text}&rdquo;
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(26,60,52,0.07)' }}>
                      <img
                        src={`https://api.dicebear.com/7.x/${role === 'Patient' || role.includes('Doctor') || role.includes('Cardiologist') ? 'avataaars' : 'shapes'}/svg?seed=${name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                        className="w-10 h-10 rounded-full border border-slate-100 shadow-sm"
                        alt={name}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1A3C34' }}>{name}</div>
                        <div style={{ fontSize: 12, color: '#7A9E94' }}>{role}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* CTA prompt */}
            <Reveal>
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <p style={{ color: 'rgba(26,60,52,0.5)', marginBottom: 16, fontSize: 15 }}>Join our growing community of healthcare partners and patients.</p>
                <Link to="/register" className="btn-dark" style={{ padding: '14px 36px', fontSize: 15 }}>
                  Create Free Account <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
          </div>
        </Page>

        {/* ══════════ PAGE 5 — CONTACT / FOOTER ══════════ */}
        <Page id="contact" bg="linear-gradient(160deg,#0D221B 0%,#1A3C34 100%)">
          <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px 60px', maxWidth: 1280, margin: '0 auto', gap: 48 }}>
            {/* Top: brand + cta */}
            <Reveal>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 20 }}>
                  <Logo size="lg" variant="light" className="justify-center" />
                </div>
                <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: 'white', marginBottom: 14, letterSpacing: '-.02em' }}>
                  Ready to Get Started?
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '0 auto 28px' }}>
                  Join thousands of patients and providers already using careNconnect.
                </p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/register" className="btn-grey" style={{ padding: '14px 36px', fontSize: 15 }}>
                    Create Free Account <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', background: 'rgba(255,255,255,0.07)', color: 'white', fontWeight: 700, fontSize: 15, borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none', transition: 'all .25s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

            {/* Bottom: contact + links + socials */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48 }}>
              <Reveal>
                <div>
                  <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.4)', maxWidth: 280, marginBottom: 20 }}>
                    The premier multi-category healthcare appointment platform.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                      <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      >
                        <Icon size={15} color="rgba(255,255,255,0.5)" />
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: '#3D7A68', textTransform: 'uppercase', marginBottom: 16 }}>Navigation</div>
                  {['Home', 'Services', 'About', 'Contact'].map(l => (
                    <div key={l} style={{ marginBottom: 10 }}>
                      <a href={`#${l.toLowerCase()}`} style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color .2s', fontWeight: 500 }}
                        onMouseEnter={e => e.currentTarget.style.color = 'white'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                      >{l}</a>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: '#3D7A68', textTransform: 'uppercase', marginBottom: 16 }}>Contact</div>
                  {[
                    { Icon: Mail, text: 'support@carenconnect.com' },
                    { Icon: Phone, text: '8848485663' },
                    { Icon: MapPin, text: 'Kerala, Kollam' },
                    // eslint-disable-next-line no-unused-vars
                  ].map(({ Icon, text }) => (
                    <div key={text} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
                      <Icon size={14} color="#3D7A68" style={{ marginTop: 1, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} careNconnect. All rights reserved.</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', display: 'flex', gap: 12 }}>
                <span>HIPAA Certified</span><span>·</span><span>GDPR Compliant</span>
              </p>
            </div>
          </div>
        </Page>

      </div>{/* end snap-container */}
    </>
  );
}

/* ── Inline Reveal wrapper ── */
function Reveal({ children, delay = '' }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`anim-fadeUp ${delay}`} style={{ opacity: vis ? undefined : 0, animation: vis ? undefined : 'none' }}>
      {children}
    </div>
  );
}
