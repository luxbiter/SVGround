"use client";

import { ChangeEvent, CSSProperties, PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from "react";

type FilterKey = "displace" | "slime" | "mask" | "glass" | "orbit";
type ItemKind = "shape" | "text" | "image" | "note";

type CanvasItem = {
  id: string;
  kind: ItemKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
  filter: FilterKey | "none";
  text?: string;
  src?: string;
  name?: string;
  clipImageId?: string;
};

const FILTERS: Array<{ key: FilterKey; name: string; short: string; formula: string; color: string }> = [
  { key: "displace", name: "뒤틀기", short: "WOBBLE", formula: "feTurbulence + feDisplacementMap", color: "#a6d8ff" },
  { key: "slime", name: "슬라임", short: "GOO", formula: "feGaussianBlur + feColorMatrix", color: "#d8ff4f" },
  { key: "mask", name: "클리핑 마스크", short: "MASK", formula: "clipPath + texture", color: "#ffc7dd" },
  { key: "glass", name: "리퀴드 글래스", short: "GLASS", formula: "displacement + soft light", color: "#c9c4ff" },
  { key: "orbit", name: "마우스 반응", short: "TRACK", formula: "pointer coordinates + orbit", color: "#b9efd8" },
];

const INITIAL_ITEMS: CanvasItem[] = [
  { id: "shape-1", kind: "shape", x: 46, y: 48, width: 430, height: 270, rotation: -2, z: 1, filter: "displace", text: "SVG" },
  { id: "text-1", kind: "text", x: 27, y: 26, width: 260, height: 92, rotation: -5, z: 3, filter: "mask", text: "MOVE" },
  { id: "note-1", kind: "note", x: 77, y: 24, width: 182, height: 132, rotation: 3, z: 4, filter: "none", text: "Try moving your objects." },
  { id: "shape-2", kind: "shape", x: 21, y: 70, width: 220, height: 142, rotation: 4, z: 2, filter: "slime", text: "GOO" },
];

type DragState = { id: string; offsetX: number; offsetY: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function IconButton({ label, children, active = false, onClick }: { label: string; children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return <button className={`icon-button ${active ? "is-active" : ""}`} aria-label={label} onClick={onClick}>{children}</button>;
}

function FilterDefs({ intensity, animated }: { intensity: number; animated: boolean }) {
  const scale = Math.round(12 + intensity * 52);
  return <svg className="filter-defs" aria-hidden="true" width="0" height="0">
    <defs>
      <filter id="svg-filter-displace" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="8" result="noise">{animated && <animate attributeName="baseFrequency" dur="4.5s" values=".018;.036;.018" repeatCount="indefinite" />}</feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G">{animated && <animate attributeName="scale" dur="3.6s" values={`${scale};${scale + 14};${scale}`} repeatCount="indefinite" />}</feDisplacementMap>
      </filter>
      <filter id="svg-filter-slime" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation={5 + intensity * 13} result="blur" />
        <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
      </filter>
      <filter id="svg-filter-mask" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="3" result="grain" />
        <feBlend in="SourceGraphic" in2="grain" mode="soft-light" />
      </filter>
      <filter id="svg-filter-glass" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="11" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={4 + intensity * 16} result="refraction" />
        <feGaussianBlur in="refraction" stdDeviation=".6" />
        <feColorMatrix values="1.04 0 0 0 0  0 1.04 0 0 0  0 0 1.04 0 0  0 0 0 .9 0" />
      </filter>
      <filter id="svg-filter-orbit" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="1.5" /></filter>
    </defs>
  </svg>;
}

export default function Home() {
  const [items, setItems] = useState<CanvasItem[]>(INITIAL_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>("shape-1");
  const [intensity, setIntensity] = useState(.58);
  const [animated, setAnimated] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [pointer, setPointer] = useState({ x: -40, y: -40 });
  const [boardCursor, setBoardCursor] = useState({ x: 50, y: 50 });
  const [dropActive, setDropActive] = useState(false);
  const [boardSource, setBoardSource] = useState("SVGround");
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedFilter = FILTERS.find((filter) => filter.key === selected?.filter) ?? FILTERS[0];
  const maxZ = useMemo(() => items.reduce((max, item) => Math.max(max, item.z), 0), [items]);

  function boardPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 50, y: 50 };
    return { x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100), y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100) };
  }

  function handleBoardMove(event: ReactPointerEvent<HTMLDivElement>) {
    const point = boardPoint(event);
    setBoardCursor(point);
    setPointer({ x: event.clientX, y: event.clientY });
    const drag = dragRef.current;
    if (!drag) return;
    setItems((current) => current.map((item) => item.id === drag.id ? { ...item, x: clamp(point.x - drag.offsetX, 3, 97), y: clamp(point.y - drag.offsetY, 7, 93) } : item));
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>, item: CanvasItem) {
    event.stopPropagation();
    const point = boardPoint(event);
    dragRef.current = { id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(item.id);
  }

  function endDrag() { dragRef.current = null; }

  function addImages(files: File[], origin = { x: 53, y: 50 }) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    const newItems = images.map((file, index) => ({ id: newId("image"), kind: "image" as const, x: clamp(origin.x + index * 5, 14, 82), y: clamp(origin.y + index * 4, 17, 80), width: 230, height: 170, rotation: (index % 3 - 1) * 3, z: maxZ + index + 1, filter: "glass" as const, src: URL.createObjectURL(file), name: file.name }));
    setItems((current) => [...current, ...newItems]);
    setSelectedId(newItems.at(-1)!.id);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    addImages(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDropActive(false);
    const bounds = event.currentTarget.getBoundingClientRect();
    const origin = { x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 12, 84), y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 15, 82) };
    addImages(Array.from(event.dataTransfer.files), origin);
  }

  function addText() {
    const item: CanvasItem = { id: newId("text"), kind: "text", x: 56, y: 30, width: 270, height: 100, rotation: -2, z: maxZ + 1, filter: "mask", text: "TYPE" };
    setItems((current) => [...current, item]);
    setSelectedId(item.id);
  }

  function addShape() {
    const item: CanvasItem = { id: newId("shape"), kind: "shape", x: 58, y: 63, width: 280, height: 180, rotation: 2, z: maxZ + 1, filter: "slime", text: "GOO" };
    setItems((current) => [...current, item]);
    setSelectedId(item.id);
  }

  function updateSelected(patch: Partial<CanvasItem>) {
    if (!selected) return;
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
  }

  function changeLayer(direction: "front" | "back") {
    if (!selected) return;
    const targetZ = direction === "front" ? maxZ + 1 : Math.min(...items.map((item) => item.z)) - 1;
    updateSelected({ z: targetZ });
  }

  function removeSelected() {
    if (!selected) return;
    if (selected.src) URL.revokeObjectURL(selected.src);
    setItems((current) => current.filter((item) => item.id !== selected.id));
    setSelectedId(null);
  }

  function itemStyle(item: CanvasItem): CSSProperties {
    return { left: `${item.x}%`, top: `${item.y}%`, width: item.width, height: item.height, zIndex: item.z, transform: `translate(-50%, -50%) rotate(${item.rotation}deg)` };
  }

  function filterStyle(item: CanvasItem): CSSProperties | undefined {
    return item.filter === "none" ? undefined : { filter: `url(#svg-filter-${item.filter})` };
  }

  function renderItemArtwork(item: CanvasItem) {
    const source = item.text || boardSource;
    if (item.kind === "image" && item.src && item.filter !== "mask") return <div className="image-frame"><img src={item.src} alt={item.name || "업로드 이미지"} draggable="false" style={filterStyle(item)} /><span>{item.name}</span></div>;
    if (item.kind === "note") return <div className="note-art"><span>✦</span><strong>{source}</strong><small>Drag me around.<br />Layer things on top.</small></div>;
    if (item.filter === "mask") {
      const clipImage = items.find((candidate) => candidate.id === item.clipImageId && candidate.src);
      const maskText = item.text || (item.kind === "image" ? "MASK" : source);
      const clipSource = clipImage?.src || item.src;
      return <svg className="item-svg mask-artwork" viewBox="0 0 300 190" role="img" aria-label="클리핑 마스크 오브젝트">
        <defs>
          <clipPath id={`clip-path-${item.id}`}><text x="150" y="102" textAnchor="middle" dominantBaseline="middle" fontSize="61" fontWeight="900" letterSpacing="-3">{maskText}</text></clipPath>
          <linearGradient id={`mask-gradient-${item.id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff806c" /><stop offset=".48" stopColor="#d8ff4f" /><stop offset="1" stopColor="#9b80ff" /></linearGradient>
        </defs>
        <rect width="300" height="190" rx="22" fill="#20263a" />
        <g clipPath={`url(#clip-path-${item.id})`} filter="url(#svg-filter-mask)">
          {clipSource ? <image href={clipSource} x="0" y="0" width="300" height="190" preserveAspectRatio="xMidYMid slice" /> : <rect width="300" height="190" fill={`url(#mask-gradient-${item.id})`} />}
          <circle cx="68" cy="55" r="58" fill="#6fdff0" opacity=".68" /><circle cx="246" cy="144" r="78" fill="#ff806c" opacity=".55" />
        </g>
        <text className="mask-outline" x="150" y="102" textAnchor="middle" dominantBaseline="middle" fontSize="61" fontWeight="900" letterSpacing="-3">{maskText}</text>
      </svg>;
    }
    if (item.kind === "text") return <svg className="item-svg" viewBox="0 0 300 110" style={filterStyle(item)}><defs><linearGradient id={`text-gradient-${item.id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff806c" /><stop offset=".5" stopColor="#d8ff4f" /><stop offset="1" stopColor="#9b80ff" /></linearGradient></defs><text x="150" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="72" fontWeight="900" letterSpacing="-4" fill={`url(#text-gradient-${item.id})`}>{source}</text></svg>;
    return <svg className="item-svg" viewBox="0 0 300 190" style={filterStyle(item)}><defs><linearGradient id={`shape-gradient-${item.id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d8ff4f" /><stop offset=".5" stopColor="#80dced" /><stop offset="1" stopColor="#9b80ff" /></linearGradient></defs><rect width="300" height="190" rx="24" fill={`url(#shape-gradient-${item.id})`} /><circle cx="58" cy="46" r="54" fill="#fff" opacity=".2" /><circle cx="255" cy="146" r="70" fill="#ff806c" opacity=".45" /><text x="150" y="104" textAnchor="middle" dominantBaseline="middle" fontSize="52" fontWeight="900" fill="#172331">{source}</text></svg>;
  }

  return <div className={`freeform-app ${dropActive ? "is-dropping" : ""}`}>
    <FilterDefs intensity={intensity} animated={animated} />
    <div className="canvas-surface" ref={canvasRef} onPointerMove={handleBoardMove} onPointerUp={endDrag} onPointerLeave={endDrag} onDragOver={(event) => { event.preventDefault(); setDropActive(true); }} onDragLeave={() => setDropActive(false)} onDrop={handleDrop} onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
      <header className="freeform-topbar">
        <div className="brand-lockup"><span className="brand-mark"><i /><i /><i /></span><div><strong>SVGround</strong><small>LOCAL FILTER CANVAS</small></div></div>
        <div className="tool-palette" aria-label="캔버스 도구">
          <IconButton label="선택" active>⌁</IconButton>
          <IconButton label="텍스트 추가" onClick={addText}>T</IconButton>
          <IconButton label="도형 추가" onClick={addShape}>◒</IconButton>
          <IconButton label="이미지 여러 개 추가" onClick={() => fileInputRef.current?.click()}>▧</IconButton>
          <IconButton label="Filter lab 열기" active={inspectorOpen} onClick={() => setInspectorOpen((open) => !open)}>✦</IconButton>
          <input ref={fileInputRef} className="file-input" type="file" accept="image/*" multiple onChange={handleFileInput} />
        </div>
        <div className="session-tools"><span className="local-pill"><i /> LOCAL / NO SAVE</span><IconButton label="더 보기">•••</IconButton></div>
      </header>

      <div className="board-status"><span className="status-live" /> DRAG IMAGES HERE <span>/</span> MOVE + OVERLAP FREELY</div>
      <div className="cursor-crosshair" style={{ left: pointer.x, top: pointer.y }} aria-hidden="true"><i /><i /></div>
      {dropActive && <div className="drop-overlay"><strong>DROP IMAGES TO ADD THEM</strong><span>여러 이미지를 한 번에 배치할 수 있습니다.</span></div>}

      <main className="board-space">
        <div className="board-label label-top">FILTER STUDY / 01</div>
        <div className="board-label label-bottom">SELECT · DRAG · STACK</div>
        {items.map((item) => <div key={item.id} className={`canvas-object ${item.kind}-object ${item.id === selectedId ? "is-selected" : ""}`} style={itemStyle(item)} onPointerDown={(event) => startDrag(event, item)} onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }} role="button" tabIndex={0} aria-label={`${item.kind} 오브젝트 선택`}>
          {item.id === selectedId && <span className="selection-tag">{item.kind.toUpperCase()} · SELECTED</span>}
          {renderItemArtwork(item)}
          {item.id === selectedId && <span className="selection-handle handle-nw" />}{item.id === selectedId && <span className="selection-handle handle-ne" />}{item.id === selectedId && <span className="selection-handle handle-sw" />}{item.id === selectedId && <span className="selection-handle handle-se" />}
        </div>)}
      </main>

      <div className="board-hint"><span>⌘</span> click to select <b>·</b> drag to move <b>·</b> drop images to add</div>
      {inspectorOpen && <aside className="filter-inspector" aria-label="Filter lab">
        <div className="inspector-header"><div><span className="inspector-eyebrow">OBJECT INSPECTOR</span><h2>Filter lab</h2></div><button onClick={() => setInspectorOpen(false)} aria-label="닫기">×</button></div>
        {!selected ? <div className="empty-inspector"><span>⌁</span><strong>Select an object</strong><small>캔버스의 오브젝트를 선택하면<br />필터 실험을 시작할 수 있습니다.</small></div> : <>
          <div className="selected-summary"><span className="summary-dot" style={{ background: selectedFilter.color }} /><div><strong>{selected.kind.toUpperCase()} OBJECT</strong><small>{selectedFilter.short} · {selected.name || selected.text || "untitled"}</small></div><b>{String(selected.z).padStart(2, "0")}</b></div>
          <section className="inspector-section"><div className="inspector-label"><span>APPLY FILTER</span><span>5 EFFECTS</span></div><div className="filter-stack">{FILTERS.map((filter, index) => <button key={filter.key} className={selected.filter === filter.key ? "is-active" : ""} onClick={() => updateSelected({ filter: filter.key })}><span className="filter-number">0{index + 1}</span><i style={{ background: filter.color }} /><span><strong>{filter.name}</strong><small>{filter.short}</small></span><b>{selected.filter === filter.key ? "✓" : ""}</b></button>)}</div></section>
          <section className="inspector-section"><div className="inspector-label"><span>OBJECT</span><span>{selected.width} × {selected.height}</span></div>{selected.filter === "mask" || selected.kind === "text" || selected.kind === "shape" || selected.kind === "note" ? <input className="source-field" value={selected.text || (selected.filter === "mask" ? "MASK" : "")} onChange={(event) => updateSelected({ text: event.target.value })} aria-label={selected.filter === "mask" ? "마스크 모양 텍스트" : "오브젝트 텍스트"} /> : <div className="file-name">{selected.name || "Uploaded image"}</div>}<div className="layer-actions"><button onClick={() => changeLayer("back")}>↓ 뒤로</button><button onClick={() => changeLayer("front")}>↑ 앞으로</button></div></section>
          {selected.filter === "mask" && <section className="inspector-section clip-control"><div className="inspector-label"><span>CLIP IMAGE</span><span>{items.filter((item) => item.kind === "image").length} AVAILABLE</span></div><select className="clip-select" value={selected.clipImageId || ""} onChange={(event) => updateSelected({ clipImageId: event.target.value || undefined })}><option value="">Gradient texture</option>{items.filter((item) => item.kind === "image" && item.src).map((item) => <option key={item.id} value={item.id}>{item.name || "Uploaded image"}</option>)}</select><small className="control-help">텍스트/이모지 모양 안에 이 이미지를 넣습니다.</small></section>}
          <section className="inspector-section layers-section"><div className="inspector-label"><span>LAYER ORDER</span><span>TOP → BACK</span></div><div className="layer-list">{[...items].sort((a, b) => b.z - a.z).map((item, index) => <button key={item.id} className={`layer-row ${item.id === selectedId ? "is-active" : ""}`} onClick={() => setSelectedId(item.id)}><span className="layer-rank">{String(index + 1).padStart(2, "0")}</span><i className={`layer-kind ${item.kind}`} /><span className="layer-name">{item.kind.toUpperCase()} / {item.name || item.text || "untitled"}</span><b>{item.id === selectedId ? "●" : ""}</b></button>)}</div></section>
          <section className="inspector-section controls"><div className="inspector-label"><span>FILTER INTENSITY</span><span>{Math.round(intensity * 100)}%</span></div><input className="range-input" type="range" min="0" max="1" step=".01" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /><div className="range-ends"><span>SUBTLE</span><span>CHAOS</span></div><div className="motion-row"><div><strong>LIVE MOTION</strong><small>{animated ? "animation loop on" : "paused"}</small></div><button className={`toggle ${animated ? "is-on" : ""}`} onClick={() => setAnimated((value) => !value)} aria-label="애니메이션 토글" aria-pressed={animated}><i /></button></div></section>
          <button className="delete-button" onClick={removeSelected}>Delete selected object</button>
        </>}
        <div className="inspector-footer"><span>SESSION ONLY</span><span>NOT SAVED</span></div>
      </aside>}

      <footer className="freeform-bottom-bar"><div><span className="item-count">{items.length} objects</span><span className="drop-tip">· No cloud storage ·</span></div><div className="bottom-actions"><button onClick={() => fileInputRef.current?.click()}>＋ Add images</button><button onClick={addText}>＋ Text</button><button onClick={addShape}>＋ Shape</button></div><div className="board-coords">{Math.round(boardCursor.x)} / {Math.round(boardCursor.y)}</div></footer>
    </div>
  </div>;
}
