// src/components/find/FlavourPad.jsx
//
// Two axes, one thumb. This replaces the usual stack of three 1–10 sliders,
// which nobody enjoys on a phone and which ask the drinker to self-report an
// "acidity preference" they almost certainly don't have.
//
//   x: light  →  bold     (body)
//   y: crisp  →  rich     (acidity, inverted, plus a touch of sweetness)

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { describePad } from '../../data/wineLogic';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

const FlavourPad = ({ value, onChange, size = 300 }) => {
  const padRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = useCallback(
    (clientX, clientY) => {
      const rect = padRef.current?.getBoundingClientRect();
      if (!rect) return;
      onChange({
        x: clamp01((clientX - rect.left) / rect.width),
        y: clamp01((clientY - rect.top) / rect.height),
      });
    },
    [onChange]
  );

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  // Keyboard nudging, so the pad isn't a dead end for anyone using a keyboard.
  const handleKeyDown = (e) => {
    const step = e.shiftKey ? 0.15 : 0.05;
    const moves = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    onChange({ x: clamp01(value.x + move.x), y: clamp01(value.y + move.y) });
  };

  return (
    <div className="select-none">
      {/* The descriptor gets its own line rather than sharing one with the
          hint — on a phone "Balanced, right down the middle" wrapped and
          pushed down into the pad. */}
      <div className="mb-3">
        <span className="eyebrow text-[9px] text-cream-faint">Drag to taste</span>
        <motion.div
          key={describePad(value)}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="font-display text-xl italic text-brass leading-tight mt-0.5"
        >
          {describePad(value)}
        </motion.div>
      </div>

      <div className="relative" style={{ maxWidth: size, margin: '0 auto' }}>
        {/* Axis labels sit INSIDE the pad. They used to be positioned outside
            it, which meant they overflowed the component's box and collided
            with the descriptor above and the buttons below. Keeping them
            within the border means the pad occupies exactly the space it
            claims, and the surrounding margins behave. */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 eyebrow text-[8px] text-cream-faint/70">
            Crisp
          </span>
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 eyebrow text-[8px] text-cream-faint/70">
            Rich
          </span>
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 eyebrow text-[8px] text-cream-faint/70 [writing-mode:vertical-rl] rotate-180">
            Light
          </span>
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 eyebrow text-[8px] text-cream-faint/70 [writing-mode:vertical-rl]">
            Bold
          </span>
        </div>

        <div
          ref={padRef}
          role="slider"
          tabIndex={0}
          aria-label="Flavour profile: drag horizontally for body, vertically for richness"
          aria-valuetext={describePad(value)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          className="relative aspect-square w-full bg-card border border-line touch-none cursor-crosshair focus:outline-none focus:border-brass/60 overflow-hidden"
        >
          {/* Colour field: cool and pale at crisp/light, deep and warm at rich/bold */}
          <div
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              background:
                'linear-gradient(135deg, rgb(224 193 104 / 0.30) 0%, transparent 45%), ' +
                'linear-gradient(315deg, rgb(140 47 57 / 0.55) 0%, transparent 55%)',
            }}
          />

          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none">
            {[1, 2].map((i) => (
              <span
                key={`v${i}`}
                className="absolute top-0 bottom-0 w-px bg-line/70"
                style={{ left: `${(i / 3) * 100}%` }}
              />
            ))}
            {[1, 2].map((i) => (
              <span
                key={`h${i}`}
                className="absolute left-0 right-0 h-px bg-line/70"
                style={{ top: `${(i / 3) * 100}%` }}
              />
            ))}
          </div>

          {/* Crosshair guides following the thumb */}
          <div
            className="absolute top-0 bottom-0 w-px bg-brass/25 pointer-events-none"
            style={{ left: `${value.x * 100}%` }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-brass/25 pointer-events-none"
            style={{ top: `${value.y * 100}%` }}
          />

          {/* Thumb */}
          <motion.div
            className="absolute pointer-events-none"
            style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
            animate={{ scale: dragging ? 1.25 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div
              className="w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-brass border-2 border-ink"
              style={{ boxShadow: '0 0 18px rgb(201 162 39 / 0.75)' }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FlavourPad;
