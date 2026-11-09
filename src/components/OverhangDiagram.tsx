import type { Season } from './scene/StoryScene';

/*
 * Section through the south facade. Scale: wall 80px ≈ 2.8 m, so the 1 m overhang ≈ 30px.
 * Sun rays at noon: ~69° in summer, ~26° in winter (latitude ≈ 42°N, Bishkek).
 */
const FLOOR = 130;
const WALL_X = 204;
const ROOF_Y = 50;
const EAVE_X = 234;
const WIN_TOP = 62;
const WIN_BOTTOM = 122;
const ANGLE: Record<Season, number> = { summer: 69, winter: 26 };

function rays(season: Season) {
  const tan = Math.tan((ANGLE[season] * Math.PI) / 180);
  const shadowY = ROOF_Y + (EAVE_X - WALL_X) * tan; // where the eave's shadow line meets the facade
  return [0, 22, 44].map((k) => {
    const hitY = shadowY + k;
    // incoming segment, traced back up-right to the edge of the drawing
    const back = (y: number, x: number) => {
      let sx = 320;
      let sy = y - (sx - x) * tan;
      if (sy < 0) {
        sx = x + y / tan;
        sy = 0;
      }
      return { sx, sy };
    };
    if (hitY > FLOOR) {
      const gx = WALL_X + (hitY - FLOOR) / tan;
      const { sx, sy } = back(FLOOR, gx);
      return { d: `M${sx} ${sy}L${gx} ${FLOOR}`, inside: null as string | null };
    }
    const { sx, sy } = back(hitY, WALL_X);
    const throughGlass = hitY > WIN_TOP && hitY < WIN_BOTTOM;
    const fx = Math.max(64, WALL_X - (FLOOR - hitY) / tan);
    return {
      d: `M${sx} ${sy}L${WALL_X} ${hitY}`,
      inside: throughGlass ? `M${WALL_X} ${hitY}L${fx} ${FLOOR}` : null,
    };
  });
}

export function OverhangDiagram({ season, label }: { season: Season; label: string }) {
  return (
    <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label={label}>
      {(['summer', 'winter'] as const).map((s) => {
        const tan = Math.tan((ANGLE[s] * Math.PI) / 180);
        const shadowY = Math.min(ROOF_Y + (EAVE_X - WALL_X) * tan, WIN_BOTTOM);
        const lit = s === 'winter';
        return (
          <g key={s} className="transition-opacity duration-500" style={{ opacity: season === s ? 1 : 0 }}>
            {/* glass: shaded part above the shadow line, sunlit part below */}
            <rect x={WALL_X - 3} y={WIN_TOP} width={6} height={Math.max(0, shadowY - WIN_TOP)} fill="#4b6072" />
            <rect x={WALL_X - 3} y={shadowY} width={6} height={Math.max(0, WIN_BOTTOM - shadowY)} fill="#f3b45a" />
            {lit && <path d={`M${WALL_X} ${WIN_TOP + 4}L${WALL_X} ${WIN_BOTTOM}L${70} ${FLOOR}L${150} ${FLOOR}Z`} fill="#f3b45a" opacity={0.16} />}
            {rays(s).map((r, i) => (
              <g key={i} stroke="#e8972f" strokeWidth={1.6} strokeLinecap="round" fill="none">
                <path d={r.d} />
                {r.inside && <path d={r.inside} strokeDasharray="3 4" opacity={0.8} />}
              </g>
            ))}
            <text x={60} y={22} className="fill-glacier/70 font-display" fontSize={16}>
              {ANGLE[s]}°
            </text>
          </g>
        );
      })}

      {/* ground and floor */}
      <line x1={0} y1={FLOOR} x2={320} y2={FLOOR} stroke="#e9eef1" strokeOpacity={0.35} />
      {/* wall with window opening */}
      <rect x={WALL_X - 4} y={ROOF_Y} width={8} height={WIN_TOP - ROOF_Y} fill="#dcdfdb" />
      <rect x={WALL_X - 4} y={WIN_BOTTOM} width={8} height={FLOOR - WIN_BOTTOM} fill="#dcdfdb" />
      {/* roof slab with larch soffit and 1 m overhang */}
      <rect x={60} y={ROOF_Y - 10} width={EAVE_X - 60} height={10} fill="#3d5b82" />
      <rect x={60} y={ROOF_Y - 1.5} width={EAVE_X - 60} height={1.5} fill="#b98250" />
      {/* overhang dimension */}
      <g stroke="#e9eef1" strokeOpacity={0.7} strokeWidth={1}>
        <line x1={WALL_X} y1={ROOF_Y - 18} x2={EAVE_X} y2={ROOF_Y - 18} />
        <line x1={WALL_X} y1={ROOF_Y - 22} x2={WALL_X} y2={ROOF_Y - 14} />
        <line x1={EAVE_X} y1={ROOF_Y - 22} x2={EAVE_X} y2={ROOF_Y - 14} />
      </g>
      <text x={(WALL_X + EAVE_X) / 2} y={ROOF_Y - 26} textAnchor="middle" fontSize={14} className="fill-glacier">
        1 м
      </text>
    </svg>
  );
}
