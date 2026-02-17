import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import styles from "./EventCalendar.module.css";
import {
  ChevronLeft, ChevronRight, X, Calendar, Clock,
  MapPin, Tag, Search, Download, ExternalLink,
  LayoutGrid, List, ChevronUp, ChevronDown,
} from "lucide-react";

// ─────────────────────────────────────────────
// MOCK DATA  (reemplazar con llamada al backend)
// ─────────────────────────────────────────────
export const MOCK_EVENTS = [
  {
    id: 1, title: "Noche de Jazz en Vivo",
    date: "2026-02-08", time: "20:00", endTime: "23:00",
    location: "Café Central", business: "Café Central",
    category: "Música", color: "#B00020",
    description: "Una velada especial con los mejores músicos de jazz. Entrada libre con consumición.",
  },
  {
    id: 2, title: "Taller de Barismo",
    date: "2026-02-12", time: "10:00", endTime: "12:00",
    location: "Coffee Lab", business: "Coffee Lab",
    category: "Gastronomía", color: "#FB8C00",
    description: "Aprendé los secretos del café de especialidad. Incluye degustación y certificado.",
  },
  {
    id: 3, title: "Clase de Yoga al Aire Libre",
    date: "2026-02-15", time: "08:00", endTime: "09:30",
    location: "Parque Central", business: "FitLife Studio",
    category: "Deportes", color: "#43A047",
    description: "Iniciá el día con energía. Clase para todos los niveles en el parque.",
  },
  {
    id: 4, title: "Feria de Emprendedores",
    date: "2026-02-15", time: "14:00", endTime: "20:00",
    location: "Plaza Mayor", business: "Comunidad Local",
    category: "Comercio", color: "#1976D2",
    description: "Más de 50 emprendedores locales. Artesanías, gastronomía y tecnología.",
  },
  {
    id: 5, title: "Degustación de Vinos",
    date: "2026-02-20", time: "19:30", endTime: "22:00",
    location: "Bodega del Centro", business: "Bodega del Centro",
    category: "Gastronomía", color: "#8E24AA",
    description: "Cata guiada de vinos argentinos con maridaje. Capacidad limitada.",
  },
  {
    id: 6, title: "Workshop de Fotografía",
    date: "2026-02-22", time: "15:00", endTime: "18:00",
    location: "Estudio Imagen", business: "Estudio Imagen",
    category: "Arte", color: "#D81B60",
    description: "Técnicas de fotografía urbana. Trae tu cámara o smartphone.",
  },
  {
    id: 7, title: "Happy Hour 2x1",
    date: "2026-02-27", time: "18:00", endTime: "21:00",
    location: "Bar La Esquina", business: "Bar La Esquina",
    category: "Gastronomía", color: "#FB8C00",
    description: "Cócteles 2x1 de 18 a 21 hs. Música en vivo a partir de las 20.",
  },
  {
    id: 8, title: "Mercado Artesanal",
    date: "2026-03-07", time: "10:00", endTime: "18:00",
    location: "Patio del Centro", business: "Arte Local",
    category: "Arte", color: "#D81B60",
    description: "Feria mensual de artesanos y diseñadores locales.",
  },
  {
    id: 9, title: "Torneo de Ajedrez",
    date: "2026-03-14", time: "15:00", endTime: "20:00",
    location: "Biblioteca Municipal", business: "Club Ajedrez",
    category: "Deportes", color: "#43A047",
    description: "Torneo abierto para todas las categorías. Premios para los tres primeros.",
  },
];

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const DAYS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTHS_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getDaysInMonth   = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay      = (y, m) => new Date(y, m, 1).getDay();
const toKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

const toGCalDate = (dateStr, timeStr) => {
  const d = dateStr.replace(/-/g,"");
  if (!timeStr) return d;
  return `${d}T${timeStr.replace(":","").padEnd(6,"0")}`;
};

// ─────────────────────────────────────────────
// EXPORT HELPERS
// ─────────────────────────────────────────────
const openGoogleCalendar = (ev) => {
  const start = toGCalDate(ev.date, ev.time);
  const end   = toGCalDate(ev.date, ev.endTime || ev.time);
  const p = new URLSearchParams({
    action:"TEMPLATE", text:ev.title,
    dates:`${start}/${end}`,
    details:ev.description||"", location:ev.location||"",
  });
  window.open(`https://calendar.google.com/calendar/render?${p}`, "_blank");
};

const downloadICal = (ev) => {
  const start = toGCalDate(ev.date, ev.time);
  const end   = toGCalDate(ev.date, ev.endTime || ev.time);
  const now   = new Date().toISOString().replace(/[-:.]/g,"").slice(0,15)+"Z";
  const ics   = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//DondeQueda//ES",
    "BEGIN:VEVENT",
    `UID:event-${ev.id}@dondequeda`,
    `DTSTAMP:${now}`, `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${(ev.description||"").replace(/\n/g,"\\n")}`,
    `LOCATION:${ev.location||""}`,
    "END:VEVENT","END:VCALENDAR",
  ].join("\r\n");
  const a = Object.assign(document.createElement("a"),{
    href:URL.createObjectURL(new Blob([ics],{type:"text/calendar"})),
    download:`${ev.title.replace(/\s+/g,"_")}.ics`,
  });
  a.click();
};

// ─────────────────────────────────────────────
// SELECTOR MES/AÑO (popover)
// ─────────────────────────────────────────────
const MonthYearPicker = ({ year, month, onSelect, onClose }) => {
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className={styles.picker} ref={ref}>
      {/* Selector de año */}
      <div className={styles.pickerYearRow}>
        <button className={styles.pickerYearBtn} onClick={() => setPickerYear(y => y - 1)}>
          <ChevronLeft size={15}/>
        </button>
        <span className={styles.pickerYear}>{pickerYear}</span>
        <button className={styles.pickerYearBtn} onClick={() => setPickerYear(y => y + 1)}>
          <ChevronRight size={15}/>
        </button>
      </div>
      {/* Grid de meses */}
      <div className={styles.pickerMonthGrid}>
        {MONTHS_SHORT.map((m, i) => {
          const isActive = pickerYear === year && i === month;
          const isToday  = pickerYear === new Date().getFullYear() && i === new Date().getMonth();
          return (
            <button
              key={i}
              className={`${styles.pickerMonth} ${isActive ? styles.pickerMonthActive : ""} ${isToday && !isActive ? styles.pickerMonthToday : ""}`}
              onClick={() => { onSelect(pickerYear, i); onClose(); }}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// HOVER TOOLTIP
// ─────────────────────────────────────────────
const DayTooltip = ({ events, visible }) => {
  if (!visible || !events?.length) return null;
  return (
    <div className={styles.tooltip}>
      {events.slice(0, 3).map(ev => (
        <div key={ev.id} className={styles.tooltipItem}>
          <span className={styles.tooltipDot} style={{ background: ev.color }}/>
          <span className={styles.tooltipTitle}>{ev.title}</span>
          {ev.time && <span className={styles.tooltipTime}>{ev.time}</span>}
        </div>
      ))}
      {events.length > 3 && (
        <p className={styles.tooltipMore}>+{events.length - 3} más…</p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// EXPORT BUTTONS
// ─────────────────────────────────────────────
const ExportButtons = ({ event }) => (
  <div className={styles.exportRow}>
    <button className={styles.exportGoogle} onClick={() => openGoogleCalendar(event)}>
      <ExternalLink size={13}/> Google Calendar
    </button>
    <button className={styles.exportIcal} onClick={() => downloadICal(event)}>
      <Download size={13}/> iCal / Apple
    </button>
  </div>
);

// ─────────────────────────────────────────────
// MODAL DETALLE DÍA
// ─────────────────────────────────────────────
const DayModal = ({ events, date, onClose }) => {
  const label = new Date(date + "T12:00:00").toLocaleDateString("es-AR",{
    weekday:"long", day:"numeric", month:"long",
  });
  // Cerrar con ESC
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTop}>
          <div>
            <p className={styles.modalSub}>{events.length} evento{events.length > 1 ? "s" : ""}</p>
            <h3 className={styles.modalTitle}>{label}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>
        <div className={styles.modalCards}>
          {events.map(ev => (
            <div key={ev.id} className={styles.modalCard}>
              <div className={styles.modalCardBar} style={{ background: ev.color }}/>
              <div className={styles.modalCardBody}>
                <span className={styles.chip} style={{ background:`${ev.color}1a`, color:ev.color }}>
                  <Tag size={11}/> {ev.category}
                </span>
                <h4 className={styles.modalCardTitle}>{ev.title}</h4>
                <p className={styles.modalCardDesc}>{ev.description}</p>
                <div className={styles.modalCardMeta}>
                  {ev.time && (
                    <span><Clock size={12}/> {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ""} hs</span>
                  )}
                  {ev.location && <span><MapPin size={12}/> {ev.location}</span>}
                </div>
                <p className={styles.modalCardBusiness}>por {ev.business}</p>
                <ExportButtons event={ev}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// VISTA SEMANA
// ─────────────────────────────────────────────
const WeekView = ({ anchorDate, eventsByDate, onDayClick }) => {
  const today = new Date();
  const sun   = new Date(anchorDate);
  sun.setDate(anchorDate.getDate() - anchorDate.getDay());

  return (
    <div className={styles.weekGrid}>
      {Array.from({ length: 7 }, (_, i) => {
        const d   = new Date(sun); d.setDate(sun.getDate() + i);
        const key = toKey(d.getFullYear(), d.getMonth(), d.getDate());
        const evs = eventsByDate[key] || [];
        const isToday =
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear();

        return (
          <div
            key={i}
            className={`${styles.weekCol} ${isToday ? styles.weekColToday : ""} ${evs.length ? styles.weekColActive : ""}`}
            onClick={() => evs.length && onDayClick(key, evs)}
          >
            <div className={styles.weekColHeader}>
              <span className={styles.weekColDay}>{DAYS_SHORT[i]}</span>
              <span className={`${styles.weekColNum} ${isToday ? styles.weekColNumToday : ""}`}>
                {d.getDate()}
              </span>
            </div>
            <div className={styles.weekColEvents}>
              {evs.slice(0, 4).map(ev => (
                <div key={ev.id} className={styles.weekChip}
                  style={{ borderLeftColor: ev.color, background:`${ev.color}12` }}>
                  {ev.time && <span className={styles.weekChipTime}>{ev.time}</span>}
                  <span className={styles.weekChipTitle}>{ev.title}</span>
                </div>
              ))}
              {evs.length > 4 && <span className={styles.weekMore}>+{evs.length - 4} más</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
const EventCalendar = ({ events = MOCK_EVENTS, compact = false }) => {
  const today = new Date();

  const [view,       setView      ] = useState("month");
  const [year,       setYear      ] = useState(today.getFullYear());
  const [month,      setMonth     ] = useState(today.getMonth());
  const [weekAnchor, setWeekAnchor] = useState(new Date(today));
  const [query,      setQuery     ] = useState("");
  const [selDate,    setSelDate   ] = useState(null);
  const [selEvs,     setSelEvs    ] = useState([]);
  const [slide,      setSlide     ] = useState("");
  const [animating,  setAnimating ] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null); // dateKey hovereado

  // Swipe touch
  const touchStartX = useRef(null);

  // ── filtrar ──
  const filtered = useMemo(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.category||"").toLowerCase().includes(q) ||
      (e.location||"").toLowerCase().includes(q) ||
      (e.business||"").toLowerCase().includes(q)
    );
  }, [events, query]);

  // ── agrupar por fecha ──
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [filtered]);

  // ── navegación con slide ──
  const navigate = useCallback((dir) => {
    if (animating) return;
    setSlide(dir === 1 ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      if (view === "month") {
        let m = month + dir, y = year;
        if (m > 11) { m = 0; y++; }
        if (m < 0)  { m = 11; y--; }
        setMonth(m); setYear(y);
      } else {
        setWeekAnchor(prev => {
          const nd = new Date(prev);
          nd.setDate(prev.getDate() + dir * 7);
          return nd;
        });
      }
      setSlide(""); setAnimating(false);
    }, 220);
  }, [animating, view, month, year]);

  // ── swipe mobile ──
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  // ── ir a hoy ──
  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setWeekAnchor(new Date(today));
  };
  const isCurrentPeriod =
    view === "month"
      ? year === today.getFullYear() && month === today.getMonth()
      : (() => {
          const sun = new Date(weekAnchor);
          sun.setDate(weekAnchor.getDate() - weekAnchor.getDay());
          const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
          return today >= sun && today <= sat;
        })();

  // ── abrir día ──
  const openDay = useCallback((key, dayEvs) => {
    const evs = dayEvs || byDate[key] || [];
    if (!evs.length) return;
    setSelDate(key); setSelEvs(evs);
  }, [byDate]);

  // ── panel lateral ──
  const panelEvs = useMemo(() => {
    if (view === "month") {
      return filtered
        .filter(e => { const [y,m] = e.date.split("-").map(Number); return y===year && m-1===month; })
        .sort((a,b) => a.date.localeCompare(b.date) || (a.time||"").localeCompare(b.time||""));
    }
    const sun = new Date(weekAnchor); sun.setDate(weekAnchor.getDate() - weekAnchor.getDay());
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
    return filtered
      .filter(e => { const d = new Date(e.date+"T12:00:00"); return d>=sun && d<=sat; })
      .sort((a,b) => a.date.localeCompare(b.date) || (a.time||"").localeCompare(b.time||""));
  }, [filtered, view, year, month, weekAnchor]);

  // ── próximos eventos (para header externo) ──
  const upcomingCount = useMemo(() => {
    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
    return events.filter(e => e.date >= todayKey).length;
  }, [events]);

  // ── título header ──
  const headerTitle = useMemo(() => {
    if (view === "month") return `${MONTHS_FULL[month]} ${year}`;
    const sun = new Date(weekAnchor); sun.setDate(weekAnchor.getDate() - weekAnchor.getDay());
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
    const fmt = d => d.toLocaleDateString("es-AR",{day:"numeric",month:"short"});
    return `${fmt(sun)} – ${fmt(sat)}`;
  }, [view, month, year, weekAnchor]);

  // ── grid mensual ──
  const total    = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const isTodayFn = d =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className={`${styles.root} ${compact ? styles.compact : ""}`}>

      {/* ═══ CALENDARIO ═══ */}
      <div
        className={styles.calPanel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Buscador */}
        <div className={styles.search}>
          <Search size={15} className={styles.searchIco}/>
          <input
            className={styles.searchInput}
            placeholder="Buscar eventos, lugares, categorías…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.searchX} onClick={() => setQuery("")}><X size={13}/></button>
          )}
        </div>

        {/* Nav bar */}
        <div className={styles.navBar}>
          <button className={styles.navArrow} onClick={() => navigate(-1)} disabled={animating}>
            <ChevronLeft size={19}/>
          </button>

          <div className={styles.navCenter}>
            {/* Título clickeable → abre picker */}
            <div className={styles.titleWrapper}>
              <button
                className={styles.navTitleBtn}
                onClick={() => setShowPicker(p => !p)}
                title="Seleccionar mes y año"
              >
                <Calendar size={14} className={styles.navIco}/>
                <span>{headerTitle}</span>
                {showPicker ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>

              {/* Popover picker */}
              {showPicker && view === "month" && (
                <MonthYearPicker
                  year={year}
                  month={month}
                  onSelect={(y, m) => { setYear(y); setMonth(m); }}
                  onClose={() => setShowPicker(false)}
                />
              )}
            </div>

            <div className={styles.navActions}>
              {/* Botón "Hoy" — aparece solo cuando no estás en el período actual */}
              {!isCurrentPeriod && (
                <button className={styles.todayBtn} onClick={goToToday}>
                  Hoy
                </button>
              )}
              {/* Toggle vista */}
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.vBtn} ${view === "month" ? styles.vBtnOn : ""}`}
                  onClick={() => setView("month")} title="Mes"
                ><LayoutGrid size={14}/></button>
                <button
                  className={`${styles.vBtn} ${view === "week" ? styles.vBtnOn : ""}`}
                  onClick={() => setView("week")} title="Semana"
                ><List size={14}/></button>
              </div>
            </div>
          </div>

          <button className={styles.navArrow} onClick={() => navigate(1)} disabled={animating}>
            <ChevronRight size={19}/>
          </button>
        </div>

        {/* Cuerpo animado */}
        <div
          className={`${styles.calBody} ${slide === "left" ? styles.slideLeft : ""} ${slide === "right" ? styles.slideRight : ""}`}
        >
          {view === "month" ? (
            <>
              <div className={styles.dowRow}>
                {DAYS_SHORT.map(d => <span key={d} className={styles.dow}>{d}</span>)}
              </div>
              <div className={styles.grid}>
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`g${i}`} className={styles.empty}/>
                ))}
                {Array.from({ length: total }, (_, i) => {
                  const d   = i + 1;
                  const k   = toKey(year, month, d);
                  const evs = byDate[k] || [];
                  const has = evs.length > 0;
                  const isTd= isTodayFn(d);

                  return (
                    <div
                      key={d}
                      className={`${styles.day} ${has ? styles.dayHas : ""} ${isTd ? styles.dayToday : ""} ${selDate === k ? styles.daySel : ""}`}
                      onClick={() => openDay(k)}
                      onMouseEnter={() => has && setHoveredDay(k)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <span className={styles.dayNum}>{d}</span>

                      {/* Dots — con pulso en "hoy" si tiene eventos */}
                      {has && (
                        <div className={styles.dots}>
                          {evs.slice(0, 3).map((ev, idx) => (
                            <span
                              key={idx}
                              className={`${styles.dot} ${isTd && idx === 0 ? styles.dotPulse : ""}`}
                              style={{ background: ev.color }}
                            />
                          ))}
                          {evs.length > 3 && <span className={styles.dotPlus}>+{evs.length - 3}</span>}
                        </div>
                      )}

                      {/* Hover tooltip */}
                      <DayTooltip events={evs} visible={hoveredDay === k}/>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <WeekView anchorDate={weekAnchor} eventsByDate={byDate} onDayClick={openDay}/>
          )}
        </div>

        {/* Leyenda */}
        <div className={styles.hint}>
          {query
            ? <><Search size={12}/> {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{query}"</>
            : <><span className={styles.hintDot} style={{ background:"#B00020" }}/> Pasá el mouse por un día o hacé click para ver detalles</>
          }
        </div>
      </div>

      {/* ═══ PANEL LATERAL ═══ */}
      {!compact && (
        <div className={styles.sidePanel}>
          <div className={styles.sidePanelHead}>
            <div>
              <h3 className={styles.sidePanelTitle}>
                {view === "month" ? `Eventos en ${MONTHS_FULL[month]}` : "Esta semana"}
              </h3>
              {upcomingCount > 0 && (
                <p className={styles.upcomingHint}>
                  {upcomingCount} próximos evento{upcomingCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <span className={styles.sidePanelCount}>{panelEvs.length}</span>
          </div>

          {panelEvs.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={38} className={styles.emptyIco}/>
              <p>{query ? "Sin resultados para tu búsqueda" : "No hay eventos en este período"}</p>
            </div>
          ) : (
            <div className={styles.evList}>
              {panelEvs.map(ev => {
                const dayN = parseInt(ev.date.split("-")[2], 10);
                const wday = new Date(ev.date+"T12:00:00").toLocaleDateString("es-AR",{weekday:"short"});
                return (
                  <div key={ev.id} className={styles.evItem} onClick={() => openDay(ev.date, byDate[ev.date])}>
                    <div className={styles.evBar} style={{ background: ev.color }}/>
                    <div className={styles.evBadge} style={{ background:`${ev.color}12`, borderColor:`${ev.color}30` }}>
                      <span className={styles.evDay} style={{ color: ev.color }}>{dayN}</span>
                      <span className={styles.evWday}>{wday}</span>
                    </div>
                    <div className={styles.evInfo}>
                      <div className={styles.evInfoTop}>
                        <span className={styles.evCat} style={{ background:`${ev.color}18`, color:ev.color }}>
                          {ev.category}
                        </span>
                        {ev.time && <span className={styles.evTime}><Clock size={11}/>{ev.time}</span>}
                      </div>
                      <p className={styles.evTitle}>{ev.title}</p>
                      <p className={styles.evLoc}><MapPin size={11}/>{ev.location}</p>
                    </div>
                    <div className={styles.evExport}>
                      <button className={styles.miniBtn} onClick={e => { e.stopPropagation(); openGoogleCalendar(ev); }} title="Google Calendar">
                        <ExternalLink size={12}/>
                      </button>
                      <button className={styles.miniBtn} onClick={e => { e.stopPropagation(); downloadICal(ev); }} title="iCal">
                        <Download size={12}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {selDate && (
        <DayModal events={selEvs} date={selDate} onClose={() => setSelDate(null)}/>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// EXPORT: contador de próximos para usar en header
// ─────────────────────────────────────────────
export const getUpcomingCount = (events) => {
  const today = new Date().toISOString().split("T")[0];
  return events.filter(e => e.date >= today).length;
};

export default EventCalendar;