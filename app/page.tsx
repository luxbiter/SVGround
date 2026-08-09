"use client";

import { ChangeEvent, useMemo, useState } from "react";

type FilterKey = "displace" | "slime" | "mask" | "glass" | "orbit";
type SourceMode = "text" | "emoji" | "image";

const FILTERS: Array<{
  key: FilterKey;
  index: string;
  name: string;
  detail: string;
  tag: string;
}> = [
  {
    key: "displace",
    index: "01",
    name: "뒤틀기",
    detail: "TURBULENCE / DISPLACEMENT",
    tag: "WOBBLE",
  },
  {
    key: "slime",
    index: "02",
    name: "슬라임",
    detail: "BLUR / CONTRAST",
    tag: "GOO",
  },
  {
    key: "mask",
    index: "03",
    name: "클리핑 마스크",
    detail: "TYPE / SHAPE",
    tag: "MASK",
  },
  {
    key: "glass",
    index: "04",
    name: "리퀴드 글래스",
    detail: "REFRACTION / GLOW",
    tag: "GLASS",
  },
  {
    key: "orbit",
    index: "05",
    name: "마우스 반응",
    detail: "POINTER / ORBIT",
    tag: "TRACK",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("displace");
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [sourceText, setSourceText] = useState("SVGROUND");
  const [intensity, setIntensity] = useState(0.58);
  const [animated, setAnimated] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 54, y: 42 });

  const active = FILTERS.find((filter) => filter.key === activeFilter) ?? FILTERS[0];
  const stageVars = {
    "--pointer-x": `${pointer.x}%`,
    "--pointer-y": `${pointer.y}%`,
  } as React.CSSProperties;

  const normalizedSource = useMemo(() => {
    const trimmed = sourceText.trim();
    return trimmed || (sourceMode === "emoji" ? "✦" : "SVGROUND");
  }, [sourceMode, sourceText]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setSourceMode("image");
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100),
    });
  }

  function renderSource(options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fill?: string;
    opacity?: number;
    className?: string;
  } = {}) {
    const { x = 450, y = 310, width = 720, height = 330, fontSize = 118, fill = "currentColor", opacity = 1, className } = options;

    if (sourceMode === "image" && imageUrl) {
      return (
        <image
          href={imageUrl}
          x={x - width / 2}
          y={y - height / 2}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
          opacity={opacity}
          className={className}
        />
      );
    }

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={sourceMode === "emoji" ? fontSize * 1.45 : fontSize}
        fontWeight="900"
        letterSpacing={sourceMode === "emoji" ? 0 : -5}
        fill={fill}
        opacity={opacity}
        className={className}
      >
        {normalizedSource}
      </text>
    );
  }

  function renderPreview() {
    const displacementScale = Math.round(12 + intensity * 56);
    const slimeGap = Math.round(80 - intensity * 62);
    const orbitX = (pointer.x / 100) * 900;
    const orbitY = (pointer.y / 100) * 580;

    if (activeFilter === "displace") {
      return (
        <svg className="preview-svg" viewBox="0 0 900 580" role="img" aria-label="뒤틀기 필터 미리보기">
          <defs>
            <linearGradient id="displace-surface" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d7ff47" />
              <stop offset="0.46" stopColor="#a6e1ff" />
              <stop offset="1" stopColor="#886cff" />
            </linearGradient>
            <filter id="displace-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="8" result="noise">
                {animated && (
                  <animate attributeName="baseFrequency" dur="4.5s" values="0.012;0.032;0.012" repeatCount="indefinite" />
                )}
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={displacementScale} xChannelSelector="R" yChannelSelector="G">
                {animated && (
                  <animate attributeName="scale" dur="3.8s" values={`${displacementScale};${displacementScale + 16};${displacementScale}`} repeatCount="indefinite" />
                )}
              </feDisplacementMap>
            </filter>
            <filter id="displace-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>
          <rect width="900" height="580" fill="#101522" />
          <circle cx="690" cy="90" r="170" fill="#253b64" opacity="0.46" filter="url(#displace-shadow)" />
          <g filter="url(#displace-filter)" transform={`translate(${(pointer.x - 50) * 0.12} ${(pointer.y - 50) * 0.1})`}>
            <rect x="82" y="88" width="736" height="390" rx="34" fill="url(#displace-surface)" />
            <circle cx="156" cy="154" r="90" fill="#ffffff" opacity="0.22" />
            <circle cx="742" cy="428" r="152" fill="#ff6b9d" opacity="0.58" />
            {renderSource({ x: 450, y: 286, width: 680, height: 292, fontSize: 116, fill: "#121827", opacity: 0.94 })}
          </g>
          <g className="svg-ui-label">
            <text x="86" y="532">feTURBULENCE</text>
            <text x="814" y="532" textAnchor="end">SCALE {displacementScale}</text>
          </g>
        </svg>
      );
    }

    if (activeFilter === "slime") {
      return (
        <svg className="preview-svg" viewBox="0 0 900 580" role="img" aria-label="슬라임 필터 미리보기">
          <defs>
            <filter id="slime-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={5 + intensity * 15} result="blur" />
              <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
            </filter>
            <linearGradient id="slime-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d8ff53" />
              <stop offset="0.52" stopColor="#58e8ab" />
              <stop offset="1" stopColor="#4db6ff" />
            </linearGradient>
            <radialGradient id="slime-glow">
              <stop offset="0" stopColor="#d9ff65" stopOpacity="0.55" />
              <stop offset="1" stopColor="#d9ff65" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="900" height="580" fill="#e9f1ea" />
          <circle cx="140" cy="80" r="240" fill="url(#slime-glow)" />
          <circle cx="790" cy="510" r="280" fill="#c7deff" opacity="0.5" />
          <g filter="url(#slime-filter)" fill="url(#slime-fill)">
            <circle cx={250 - slimeGap / 2} cy="292" r="110" />
            <circle cx={450} cy="280" r="146" />
            <circle cx={650 + slimeGap / 2} cy="300" r="104" />
            <rect x="290" y="254" width="320" height="112" rx="56" />
            {sourceMode === "image" && imageUrl ? renderSource({ x: 450, y: 294, width: 240, height: 200, opacity: 0.9 }) : renderSource({ x: 450, y: 296, fontSize: 88, fill: "#173b45" })}
          </g>
          <g className="svg-ui-label dark-label">
            <text x="86" y="532">BLUR + COLOR MATRIX</text>
            <text x="814" y="532" textAnchor="end">STICK {Math.round(intensity * 100)}%</text>
          </g>
        </svg>
      );
    }

    if (activeFilter === "mask") {
      return (
        <svg className="preview-svg" viewBox="0 0 900 580" role="img" aria-label="클리핑 마스크 미리보기">
          <defs>
            <clipPath id="type-clip" clipPathUnits="userSpaceOnUse">
              <text x="450" y="312" textAnchor="middle" dominantBaseline="middle" fontSize="126" fontWeight="900" letterSpacing="-6">
                {normalizedSource}
              </text>
            </clipPath>
            <linearGradient id="mask-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff7057" />
              <stop offset="0.5" stopColor="#ffc857" />
              <stop offset="1" stopColor="#f0449d" />
            </linearGradient>
            <filter id="mask-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="3" result="grain" />
              <feBlend in="SourceGraphic" in2="grain" mode="soft-light" />
            </filter>
          </defs>
          <rect width="900" height="580" fill="#211a2d" />
          <g clipPath="url(#type-clip)" filter="url(#mask-grain)">
            <rect width="900" height="580" fill="url(#mask-gradient)" />
            <circle cx={170 + pointer.x * 2} cy={110 + pointer.y} r="180" fill="#5edbff" opacity="0.78" />
            <circle cx={720 - pointer.x} cy="455" r="220" fill="#773eff" opacity="0.6" />
            <path d="M-20 470 C180 310 330 560 505 390 S760 270 930 380 L930 620 L-20 620Z" fill="#d3ff48" opacity="0.68" />
            {imageUrl && sourceMode === "image" && renderSource({ x: 450, y: 290, width: 900, height: 580, opacity: 0.46 })}
          </g>
          <text className="mask-outline" x="450" y="312" textAnchor="middle" dominantBaseline="middle" fontSize="126" fontWeight="900" letterSpacing="-6">
            {normalizedSource}
          </text>
          <g className="svg-ui-label light-label">
            <text x="86" y="532">CLIPPATH / TYPE SHAPE</text>
            <text x="814" y="532" textAnchor="end">LIVE MASK</text>
          </g>
        </svg>
      );
    }

    if (activeFilter === "glass") {
      return (
        <svg className="preview-svg" viewBox="0 0 900 580" role="img" aria-label="리퀴드 글래스 필터 미리보기">
          <defs>
            <linearGradient id="glass-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#cfdeff" />
              <stop offset="0.5" stopColor="#d8f5ef" />
              <stop offset="1" stopColor="#ffe0d2" />
            </linearGradient>
            <filter id="glass-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="11" result="glass-noise">
                {animated && <animate attributeName="baseFrequency" dur="7s" values="0.02;0.04;0.02" repeatCount="indefinite" />}
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="glass-noise" scale={4 + intensity * 18} result="refraction" />
              <feGaussianBlur in="refraction" stdDeviation="0.65" result="soft" />
              <feColorMatrix in="soft" values="1.04 0 0 0 0  0 1.04 0 0 0  0 0 1.04 0 0  0 0 0 0.88 0" />
            </filter>
          </defs>
          <rect width="900" height="580" fill="url(#glass-bg)" />
          <circle cx={110 + pointer.x} cy={120 + pointer.y} r="142" fill="#ee6a9c" opacity="0.82" />
          <circle cx={730 - pointer.x / 2} cy="156" r="185" fill="#9f81ff" opacity="0.66" />
          <rect x="120" y="110" width="660" height="360" rx="48" fill="#ffffff" opacity="0.12" stroke="#ffffff" strokeOpacity="0.78" strokeWidth="2" filter="url(#glass-filter)" />
          <g filter="url(#glass-filter)">
            <circle cx={260 + pointer.x / 4} cy={350 - pointer.y / 5} r="74" fill="#d3ff48" opacity="0.82" />
            <circle cx={675 - pointer.x / 5} cy={355 + pointer.y / 7} r="92" fill="#56b6ff" opacity="0.84" />
            {renderSource({ x: 450, y: 284, fontSize: 92, fill: "#182332", opacity: 0.86 })}
          </g>
          <g className="svg-ui-label dark-label">
            <text x="86" y="532">REFRACTION / SOFT LIGHT</text>
            <text x="814" y="532" textAnchor="end">MOVE POINTER</text>
          </g>
        </svg>
      );
    }

    return (
      <svg className="preview-svg" viewBox="0 0 900 580" role="img" aria-label="마우스 반응 오빗 필터 미리보기">
        <defs>
          <radialGradient id="orbit-bg" cx="50%" cy="50%">
            <stop offset="0" stopColor="#293c75" />
            <stop offset="1" stopColor="#0b0f1c" />
          </radialGradient>
          <filter id="orbit-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="orbit-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d8ff48" />
            <stop offset="1" stopColor="#5de5e4" />
          </linearGradient>
        </defs>
        <rect width="900" height="580" fill="url(#orbit-bg)" />
        <g opacity="0.42" stroke="#8194ca" strokeWidth="1">
          <path d="M0 145 H900 M0 290 H900 M0 435 H900" />
          <path d="M225 0 V580 M450 0 V580 M675 0 V580" />
        </g>
        <g transform={`translate(${orbitX} ${orbitY})`}>
          <circle r={102 + intensity * 50} fill="none" stroke="url(#orbit-line)" strokeWidth="2" strokeDasharray="4 10" opacity="0.72">
            {animated && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite" />}
          </circle>
          <circle r="58" fill="#d8ff48" opacity="0.92" filter="url(#orbit-glow)" />
          <circle cx="0" cy={-102 - intensity * 50} r="9" fill="#ff8565" />
          <circle cx={102 + intensity * 50} cy="0" r="7" fill="#6bcdff" />
          <path d="M-185 0 H185 M0 -185 V185" stroke="#d8ff48" strokeWidth="1" opacity="0.45" />
          {renderSource({ x: 0, y: 5, fontSize: sourceMode === "emoji" ? 50 : 38, fill: "#102022" })}
        </g>
        <g className="svg-ui-label light-label">
          <text x="86" y="532">POINTER X {Math.round(pointer.x)} / Y {Math.round(pointer.y)}</text>
          <text x="814" y="532" textAnchor="end">ORBIT ONLINE</text>
        </g>
      </svg>
    );
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="SVGround home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>SVGround</span>
        </a>
        <nav className="topnav" aria-label="주요 메뉴">
          <a href="#playground">Playground</a>
          <a href="#library">Filter index</a>
          <a href="#about">About</a>
        </nav>
        <div className="header-status"><span className="status-dot" /> SVG / LIVE</div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span>01</span> A HANDS-ON SVG FILTER PLAYGROUND</p>
            <h1>Make<br /><em>pixels</em> move<span className="title-dot">.</span></h1>
            <p className="hero-description">브라우저 안에서 SVG 필터를 만지고, 흔들고, 녹여보세요. 코드를 몰라도 바로 반응하고, 코드를 알면 더 깊이 들어갈 수 있습니다.</p>
            <a className="hero-cta" href="#playground">Open the playground <span>↘</span></a>
          </div>
          <div className="hero-art-wrap" aria-hidden="true">
            <div className="hero-index">FILTER / 05</div>
            <svg className="hero-art" viewBox="0 0 580 460">
              <defs>
                <linearGradient id="hero-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#d8ff48" />
                  <stop offset="0.52" stopColor="#68d8eb" />
                  <stop offset="1" stopColor="#ff806d" />
                </linearGradient>
                <filter id="hero-wobble" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="5" result="hero-noise">
                    <animate attributeName="baseFrequency" dur="6s" values="0.015;0.03;0.015" repeatCount="indefinite" />
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" in2="hero-noise" scale="22" xChannelSelector="R" yChannelSelector="G">
                    <animate attributeName="scale" dur="4s" values="18;34;18" repeatCount="indefinite" />
                  </feDisplacementMap>
                </filter>
              </defs>
              <circle cx="300" cy="236" r="178" fill="#162032" stroke="#2c3b55" strokeWidth="1" />
              <g filter="url(#hero-wobble)">
                <path d="M170 226 C170 126 265 72 356 116 C433 154 457 250 407 320 C365 380 267 385 205 328 C180 305 170 270 170 226Z" fill="url(#hero-gradient)" />
                <circle cx="250" cy="164" r="58" fill="#fff" opacity="0.24" />
                <circle cx="392" cy="308" r="74" fill="#794fff" opacity="0.42" />
                <text x="300" y="250" textAnchor="middle" dominantBaseline="middle" fontSize="58" fontWeight="900" letterSpacing="-4" fill="#17202c">SVG</text>
              </g>
              <path d="M300 20 V92 M300 380 V452 M84 236 H156 M444 236 H516" stroke="#c6d5ef" strokeWidth="1" opacity="0.4" />
              <circle cx="300" cy="236" r="224" fill="none" stroke="#364865" strokeWidth="1" strokeDasharray="2 12" />
            </svg>
            <div className="hero-caption"><span>feDisplacementMap</span><span>01 / 05</span></div>
          </div>
        </section>

        <section className="workspace-section" id="playground">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span>02</span> THE PLAYGROUND</p>
              <h2>Pick a filter.<br /><span>Push it around.</span></h2>
            </div>
            <p className="section-note">마우스를 움직이거나<br />슬라이더를 당겨보세요.</p>
          </div>

          <div className="workspace-grid">
            <aside className="control-panel panel">
              <div className="panel-title"><span>FILTER STACK</span><span>0{FILTERS.length}</span></div>
              <div className="filter-list" role="tablist" aria-label="SVG filter 선택">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    className={`filter-option ${activeFilter === filter.key ? "is-active" : ""}`}
                    onClick={() => setActiveFilter(filter.key)}
                    role="tab"
                    aria-selected={activeFilter === filter.key}
                  >
                    <span className="filter-number">{filter.index}</span>
                    <span className="filter-name"><strong>{filter.name}</strong><small>{filter.detail}</small></span>
                    <span className="filter-arrow">↗</span>
                  </button>
                ))}
              </div>

              <div className="control-divider" />
              <div className="control-section">
                <div className="control-label"><span>YOUR SOURCE</span><span className="control-value">{sourceMode.toUpperCase()}</span></div>
                <div className="source-switch" role="tablist" aria-label="소스 타입">
                  <button className={sourceMode === "text" ? "is-selected" : ""} onClick={() => setSourceMode("text")}>TYPE</button>
                  <button className={sourceMode === "emoji" ? "is-selected" : ""} onClick={() => { setSourceMode("emoji"); if (sourceText === "SVGROUND") setSourceText("✦"); }}>EMOJI</button>
                  <label className={sourceMode === "image" ? "is-selected" : ""}>IMAGE<input type="file" accept="image/*" onChange={handleImageChange} /></label>
                </div>
                {sourceMode === "image" && imageUrl ? (
                  <div className="uploaded-source"><span>IMAGE LOADED</span><button onClick={() => { setImageUrl(null); setSourceMode("text"); }}>REMOVE</button></div>
                ) : (
                  <input className="source-input" value={sourceText} maxLength={18} onChange={(event) => setSourceText(event.target.value)} aria-label="미리보기 텍스트" />
                )}
              </div>

              <div className="control-section slider-section">
                <div className="control-label"><span>INTENSITY</span><span className="control-value">{Math.round(intensity * 100)}%</span></div>
                <input className="range-input" type="range" min="0" max="1" step="0.01" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} aria-label="필터 강도" />
                <div className="range-ends"><span>SUBTLE</span><span>CHAOS</span></div>
              </div>

              <div className="control-section toggle-section">
                <div><strong>LIVE MOTION</strong><small>{animated ? "animation loop on" : "animation paused"}</small></div>
                <button className={`toggle ${animated ? "is-on" : ""}`} onClick={() => setAnimated((value) => !value)} aria-label="애니메이션 켜기/끄기" aria-pressed={animated}><span /></button>
              </div>

              <div className="panel-footnote"><span className="spark">✳</span><p>필터는 클라이언트에서<br />실시간으로 렌더링됩니다.</p></div>
            </aside>

            <section className="stage-panel panel">
              <div className="stage-toolbar"><div><span className="stage-live"><i /> LIVE CANVAS</span><span className="stage-filter">/{active.tag}</span></div><span className="stage-code">SVG / FILTER</span></div>
              <div className="artboard" style={stageVars} onPointerMove={handlePointerMove} onPointerLeave={() => setPointer({ x: 54, y: 42 })}>
                <div className="cursor-readout"><span>POINTER</span><strong>{Math.round(pointer.x)} / {Math.round(pointer.y)}</strong></div>
                {renderPreview()}
                <div className="artboard-cursor" aria-hidden="true"><span /></div>
              </div>
              <div className="stage-footer"><span>DRAG YOUR CURSOR INSIDE THE CANVAS</span><span className="stage-footer-key">{active.index} / {active.name}</span></div>
            </section>
          </div>
        </section>

        <section className="index-section" id="library">
          <div className="section-heading index-heading">
            <div><p className="eyebrow"><span>03</span> FILTER INDEX</p><h2>Small primitives.<br /><span>Big feelings.</span></h2></div>
            <p className="section-note">SVG의 작은 레고 블록들이<br />화면의 질감을 바꿉니다.</p>
          </div>
          <div className="index-grid">
            <article className="index-card card-lime"><span className="card-num">01</span><div className="card-symbol wave-symbol">≈</div><h3>feTurbulence</h3><p>노이즈를 만들어<br />움직임의 씨앗이 됩니다.</p><span className="card-tag">NOISE FIELD</span></article>
            <article className="index-card card-purple"><span className="card-num">02</span><div className="card-symbol goo-symbol"><i /><i /><i /></div><h3>feDisplacementMap</h3><p>이미지의 픽셀을<br />새 좌표로 밀어냅니다.</p><span className="card-tag">PIXEL SHIFT</span></article>
            <article className="index-card card-coral"><span className="card-num">03</span><div className="card-symbol blur-symbol" /><h3>feGaussianBlur</h3><p>경계를 녹이고<br />형태 사이를 연결합니다.</p><span className="card-tag">SOFT EDGE</span></article>
            <article className="index-card card-blue"><span className="card-num">04</span><div className="card-symbol clip-symbol">A</div><h3>clipPath</h3><p>원하는 모양 안에<br />그래픽을 가둡니다.</p><span className="card-tag">SHARP SHAPE</span></article>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-mark"><span>SVG</span><span>GROUND</span></div>
          <div className="about-copy"><p className="eyebrow"><span>04</span> KEEP EXPLORING</p><p>필터 하나를 조합하면<br /><em>새로운 표정</em>이 됩니다.</p></div>
          <div className="about-meta"><span>BUILT FOR CURIOUS MINDS</span><span>2026 / SVGROUND</span></div>
        </section>
      </main>

      <footer className="site-footer"><span>SVGround</span><span>SVG FILTER PLAYGROUND</span><span>MADE TO BE TWEAKED</span></footer>
    </div>
  );
}
