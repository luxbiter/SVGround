"use client";

import { ChangeEvent, useMemo, useState } from "react";

type FilterKey = "displace" | "slime" | "mask" | "glass" | "orbit";
type SourceMode = "text" | "emoji" | "image";

const FILTERS: Array<{
  key: FilterKey;
  name: string;
  formula: string;
  color: string;
  short: string;
}> = [
  { key: "displace", name: "뒤틀기", formula: "feTurbulence + feDisplacementMap", color: "#a6d8ff", short: "WOBBLE" },
  { key: "slime", name: "슬라임", formula: "feGaussianBlur + feColorMatrix", color: "#d8ff4f", short: "GOO" },
  { key: "mask", name: "클리핑 마스크", formula: "clipPath + feTurbulence", color: "#ffc7dd", short: "MASK" },
  { key: "glass", name: "리퀴드 글래스", formula: "displacement + soft light", color: "#c9c4ff", short: "GLASS" },
  { key: "orbit", name: "마우스 반응", formula: "pointer coordinates + orbit", color: "#b9efd8", short: "TRACK" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function IconButton({
  label,
  children,
  active = false,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return <button className={`icon-button ${active ? "is-active" : ""}`} aria-label={label} onClick={onClick}>{children}</button>;
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("displace");
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [sourceText, setSourceText] = useState("SVGround");
  const [intensity, setIntensity] = useState(0.58);
  const [animated, setAnimated] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState("filter-object");
  const [zoom, setZoom] = useState(75);
  const [pointer, setPointer] = useState({ x: 54, y: 42 });

  const active = FILTERS.find((filter) => filter.key === activeFilter) ?? FILTERS[0];
  const normalizedSource = useMemo(() => sourceText.trim() || (sourceMode === "emoji" ? "✦" : "SVGround"), [sourceMode, sourceText]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setSourceMode("image");
  }

  function handleCanvasMove(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100),
    });
  }

  function renderSource(options: { x?: number; y?: number; fontSize?: number; fill?: string; opacity?: number } = {}) {
    const { x = 270, y = 165, fontSize = 74, fill = "currentColor", opacity = 1 } = options;
    if (sourceMode === "image" && imageUrl) {
      return <image href={imageUrl} x="72" y="34" width="396" height="260" preserveAspectRatio="xMidYMid slice" opacity={opacity} />;
    }
    return <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={sourceMode === "emoji" ? fontSize * 1.35 : fontSize} fontWeight="900" letterSpacing={sourceMode === "emoji" ? 0 : -3} fill={fill} opacity={opacity}>{normalizedSource}</text>;
  }

  function renderArtwork() {
    const scale = Math.round(12 + intensity * 52);
    const orbitX = (pointer.x / 100) * 540;
    const orbitY = (pointer.y / 100) * 310;

    if (activeFilter === "displace") {
      return <svg className="filter-artwork" viewBox="0 0 540 310" role="img" aria-label="뒤틀기 필터가 적용된 오브젝트">
        <defs>
          <linearGradient id="wobble-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d8ff4f" /><stop offset="0.48" stopColor="#8fe1ff" /><stop offset="1" stopColor="#8c73ff" /></linearGradient>
          <filter id="wobble-filter" x="-20%" y="-25%" width="140%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="8" result="noise">{animated && <animate attributeName="baseFrequency" dur="4.5s" values="0.018;0.036;0.018" repeatCount="indefinite" />}</feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G">{animated && <animate attributeName="scale" dur="3.6s" values={`${scale};${scale + 14};${scale}`} repeatCount="indefinite" />}</feDisplacementMap>
          </filter>
        </defs>
        <rect width="540" height="310" fill="#172230" />
        <g filter="url(#wobble-filter)"><rect x="40" y="32" width="460" height="246" rx="26" fill="url(#wobble-fill)" /><circle cx="100" cy="72" r="70" fill="#fff" opacity=".22" /><circle cx="458" cy="250" r="100" fill="#ff709b" opacity=".56" />{renderSource({ fill: "#172230", opacity: .93 })}</g>
        <text x="20" y="294" className="art-label">FE TURBULENCE / SCALE {scale}</text>
      </svg>;
    }

    if (activeFilter === "slime") {
      const gap = Math.round(48 - intensity * 35);
      return <svg className="filter-artwork" viewBox="0 0 540 310" role="img" aria-label="슬라임 필터가 적용된 오브젝트">
        <defs>
          <linearGradient id="goo-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e0ff63" /><stop offset="0.52" stopColor="#53e6b0" /><stop offset="1" stopColor="#58bfff" /></linearGradient>
          <filter id="goo-filter" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={6 + intensity * 12} result="blur" /><feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" /></filter>
        </defs>
        <rect width="540" height="310" fill="#eff4ef" />
        <g filter="url(#goo-filter)" fill="url(#goo-fill)"><circle cx={142 - gap} cy="164" r="72" /><circle cx="270" cy="154" r="91" /><circle cx={398 + gap} cy="166" r="65" /><rect x="157" y="131" width="226" height="70" rx="35" />{renderSource({ fontSize: 53, fill: "#173a45" })}</g>
        <text x="20" y="294" className="art-label art-label-dark">GAUSSIAN BLUR / CONTRAST {Math.round(intensity * 100)}%</text>
      </svg>;
    }

    if (activeFilter === "mask") {
      return <svg className="filter-artwork" viewBox="0 0 540 310" role="img" aria-label="클리핑 마스크가 적용된 오브젝트">
        <defs>
          <clipPath id="type-clip"><text x="270" y="164" textAnchor="middle" dominantBaseline="middle" fontSize="76" fontWeight="900" letterSpacing="-3">{normalizedSource}</text></clipPath>
          <linearGradient id="mask-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff806c" /><stop offset=".5" stopColor="#ffd25d" /><stop offset="1" stopColor="#ef55a4" /></linearGradient>
          <filter id="mask-noise"><feTurbulence type="fractalNoise" baseFrequency=".028" numOctaves="3" seed="3" result="grain" /><feBlend in="SourceGraphic" in2="grain" mode="soft-light" /></filter>
        </defs>
        <rect width="540" height="310" fill="#291c31" />
        <g clipPath="url(#type-clip)" filter="url(#mask-noise)"><rect width="540" height="310" fill="url(#mask-fill)" /><circle cx={90 + pointer.x} cy={60 + pointer.y / 2} r="115" fill="#5edbff" opacity=".78" /><circle cx="432" cy="268" r="150" fill="#7245ff" opacity=".62" /><path d="M-30 252 C118 142 198 302 310 205 S460 148 590 234 L590 340 L-30 340Z" fill="#d8ff4f" opacity=".65" /></g>
        <text x="270" y="164" className="mask-outline" textAnchor="middle" dominantBaseline="middle" fontSize="76" fontWeight="900" letterSpacing="-3">{normalizedSource}</text>
        <text x="20" y="294" className="art-label">CLIPPATH / TYPE SHAPE</text>
      </svg>;
    }

    if (activeFilter === "glass") {
      return <svg className="filter-artwork" viewBox="0 0 540 310" role="img" aria-label="리퀴드 글래스 필터가 적용된 오브젝트">
        <defs>
          <linearGradient id="glass-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d5e2ff" /><stop offset=".5" stopColor="#d8f6ed" /><stop offset="1" stopColor="#ffe0d3" /></linearGradient>
          <filter id="glass-filter" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="11" result="noise">{animated && <animate attributeName="baseFrequency" dur="7s" values=".022;.042;.022" repeatCount="indefinite" />}</feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale={4 + intensity * 16} result="refraction" /><feGaussianBlur in="refraction" stdDeviation=".6" /><feColorMatrix values="1.04 0 0 0 0  0 1.04 0 0 0  0 0 1.04 0 0  0 0 0 .9 0" /></filter>
        </defs>
        <rect width="540" height="310" fill="url(#glass-bg)" /><circle cx={74 + pointer.x / 2} cy={52 + pointer.y / 2} r="90" fill="#f174a5" opacity=".75" /><circle cx={460 - pointer.x / 3} cy="56" r="120" fill="#9481ff" opacity=".58" />
        <rect x="44" y="38" width="452" height="230" rx="32" fill="#fff" opacity=".18" stroke="#fff" strokeWidth="2" filter="url(#glass-filter)" />
        <g filter="url(#glass-filter)"><circle cx={152 + pointer.x / 5} cy="225" r="48" fill="#d8ff4f" opacity=".88" /><circle cx={410 - pointer.x / 6} cy="224" r="58" fill="#54bfff" opacity=".82" />{renderSource({ fontSize: 55, fill: "#182331", opacity: .87 })}</g>
        <text x="20" y="294" className="art-label art-label-dark">REFRACTION / SOFT LIGHT</text>
      </svg>;
    }

    return <svg className="filter-artwork" viewBox="0 0 540 310" role="img" aria-label="마우스 반응 필터가 적용된 오브젝트">
      <defs><radialGradient id="orbit-bg"><stop offset="0" stopColor="#354a85" /><stop offset="1" stopColor="#111826" /></radialGradient><filter id="orbit-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <rect width="540" height="310" fill="url(#orbit-bg)" /><g opacity=".33" stroke="#9bb0dd" strokeWidth="1"><path d="M0 78H540M0 155H540M0 232H540M135 0V310M270 0V310M405 0V310" /></g>
      <g transform={`translate(${orbitX} ${orbitY})`}><circle r={54 + intensity * 28} fill="none" stroke="#d8ff4f" strokeWidth="2" strokeDasharray="3 8" />{animated && <circle r="80" fill="none" stroke="#90e7ee" strokeWidth="1" strokeDasharray="2 16"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" /></circle>}<circle r="31" fill="#d8ff4f" filter="url(#orbit-glow)" /><circle cx="0" cy={-54 - intensity * 28} r="6" fill="#ff806c" />{renderSource({ x: 0, y: 3, fontSize: sourceMode === "emoji" ? 30 : 22, fill: "#132127" })}</g>
      <text x="20" y="294" className="art-label">POINTER {Math.round(pointer.x)} / {Math.round(pointer.y)} · ORBIT</text>
    </svg>;
  }

  return <div className="freeform-app">
    <div className="canvas-surface" onPointerMove={handleCanvasMove}>
      <header className="freeform-topbar">
        <div className="topbar-left">
          <IconButton label="뒤로">‹</IconButton>
          <div className="board-title"><strong>SVG Filter Lab</strong><span>⌄</span><small>iCloud에 저장됨</small></div>
        </div>
        <div className="tool-palette" aria-label="캔버스 도구">
          <IconButton label="선택 도구" active>◉</IconButton>
          <IconButton label="텍스트 도구">A</IconButton>
          <IconButton label="도형 도구">▱</IconButton>
          <IconButton label="이미지 도구">▧</IconButton>
          <IconButton label="필터 실험실" active={inspectorOpen} onClick={() => setInspectorOpen((open) => !open)}>✦</IconButton>
        </div>
        <div className="topbar-right">
          <IconButton label="실행 취소">↶</IconButton>
          <IconButton label="다시 실행">↷</IconButton>
          <IconButton label="공유">↑</IconButton>
          <IconButton label="더 보기">•••</IconButton>
          <IconButton label="편집">□↗</IconButton>
        </div>
      </header>

      <div className="board-status"><span className="status-live" /> FILTER LAB <span>/</span> EXPERIMENT 01</div>
      <div className="cursor-crosshair" style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }} aria-hidden="true"><i /><i /></div>

      <main className="board-space">
        <div className="board-label label-top">SVG FILTER / PLAYGROUND</div>
        <div className="board-label label-bottom">MOVE POINTER · SELECT OBJECT · APPLY FILTER</div>

        <button className={`canvas-object filter-object ${selectedObject === "filter-object" ? "is-selected" : ""}`} onClick={() => setSelectedObject("filter-object")} aria-label="필터 오브젝트 선택">
          <span className="object-badge">LIVE FILTER OBJECT</span>
          <span className="object-index">01</span>
          {renderArtwork()}
          {selectedObject === "filter-object" && <span className="selection-label">FILTER OBJECT <b>⌘</b></span>}
        </button>

        <button className={`canvas-object color-object ${selectedObject === "palette-object" ? "is-selected" : ""}`} onClick={() => setSelectedObject("palette-object")} aria-label="컬러 팔레트 오브젝트 선택">
          <span className="small-object-head"><span>COLOR STUDY</span><b>02</b></span>
          <span className="color-title">{normalizedSource}</span>
          <span className="swatch-row"><i /><i /><i /><i /><i /></span>
          <span className="small-object-foot">SOURCE / {sourceMode.toUpperCase()}</span>
        </button>

        <button className={`canvas-object note-object ${selectedObject === "note-object" ? "is-selected" : ""}`} onClick={() => setSelectedObject("note-object")} aria-label="실험 메모 선택">
          <span className="note-pin">✦</span><strong>Try moving<br />your cursor.</strong><span>마우스를 움직이면<br />필터가 반응합니다.</span>
        </button>

        <button className={`canvas-object mini-object ${selectedObject === "mini-object" ? "is-selected" : ""}`} onClick={() => { setSelectedObject("mini-object"); setActiveFilter("glass"); }} aria-label="글래스 오브젝트 선택">
          <svg viewBox="0 0 145 105"><defs><linearGradient id="mini-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff9c89" /><stop offset=".55" stopColor="#b8bcff" /><stop offset="1" stopColor="#d8ff4f" /></linearGradient></defs><rect width="145" height="105" rx="14" fill="url(#mini-gradient)" /><circle cx="35" cy="29" r="23" fill="#fff" opacity=".32" /><circle cx="111" cy="74" r="34" fill="#7b5cf5" opacity=".36" /><text x="73" y="58" textAnchor="middle" fontSize="23" fontWeight="900" fill="#17212c">glass</text></svg>
          <span>GLASS / 04</span>
        </button>

        {inspectorOpen && <aside className="filter-inspector" aria-label="필터 실험실">
          <div className="inspector-header"><div><span className="inspector-eyebrow">INSPECTOR</span><h2>Filter lab</h2></div><button onClick={() => setInspectorOpen(false)} aria-label="실험실 닫기">×</button></div>
          <div className="selected-summary"><span className="summary-dot" style={{ background: active.color }} /><div><strong>{selectedObject === "filter-object" ? "Filter object" : "Canvas object"}</strong><small>Selected · {active.short}</small></div><b>01</b></div>
          <div className="inspector-section"><div className="inspector-label"><span>APPLY FILTER</span><span>05 EFFECTS</span></div><div className="filter-stack">{FILTERS.map((filter, index) => <button key={filter.key} className={activeFilter === filter.key ? "is-active" : ""} onClick={() => { setActiveFilter(filter.key); setSelectedObject("filter-object"); }}><span className="filter-number">0{index + 1}</span><span className="filter-color" style={{ background: filter.color }} /><span className="filter-copy"><strong>{filter.name}</strong><small>{filter.short}</small></span><span className="filter-check">{activeFilter === filter.key ? "✓" : ""}</span></button>)}</div></div>
          <div className="inspector-section controls"><div className="inspector-label"><span>PARAMETERS</span><span>{Math.round(intensity * 100)}%</span></div><label className="parameter-label">INTENSITY<input type="range" min="0" max="1" step=".01" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label><div className="parameter-ends"><span>QUIET</span><span>LOUD</span></div><div className="motion-row"><div><strong>LIVE MOTION</strong><small>{animated ? "Playing animation loop" : "Paused"}</small></div><button className={`toggle ${animated ? "is-on" : ""}`} onClick={() => setAnimated((value) => !value)} aria-label="라이브 모션 켜기" aria-pressed={animated}><i /></button></div></div>
          <div className="inspector-section source-section"><div className="inspector-label"><span>SOURCE</span><span>{sourceMode.toUpperCase()}</span></div><div className="source-tabs"><button className={sourceMode === "text" ? "is-active" : ""} onClick={() => setSourceMode("text")}>TYPE</button><button className={sourceMode === "emoji" ? "is-active" : ""} onClick={() => { setSourceMode("emoji"); if (sourceText === "SVGround") setSourceText("✦"); }}>EMOJI</button><label className={sourceMode === "image" ? "is-active" : ""}>IMAGE<input type="file" accept="image/*" onChange={handleImageChange} /></label></div>{sourceMode === "image" && imageUrl ? <div className="image-loaded"><span>IMAGE LOADED</span><button onClick={() => { setImageUrl(null); setSourceMode("text"); }}>REMOVE</button></div> : <input className="source-field" value={sourceText} onChange={(event) => setSourceText(event.target.value)} maxLength={18} aria-label="필터 소스" />}</div>
          <div className="formula"><span>FILTER CHAIN</span><code>{active.formula}</code></div>
        </aside>}
      </main>

      <div className="canvas-hint"><span className="hint-key">⌘</span><span>Click an object to inspect</span></div>
      <footer className="freeform-bottom-bar">
        <div className="zoom-control"><button onClick={() => setZoom((value) => clamp(value - 10, 25, 200))} aria-label="축소">−</button><strong>{zoom}%</strong><button onClick={() => setZoom((value) => clamp(value + 10, 25, 200))} aria-label="확대">＋</button></div>
        <div className="bottom-center"><button aria-label="보드 보기">☷</button><button className="bottom-active" aria-label="현재 보드">▣</button><span>Filter Lab</span></div>
        <div className="bottom-right"><button aria-label="연결 보기">⌘</button><button aria-label="보드 설정">▦</button></div>
      </footer>
    </div>
  </div>;
}
