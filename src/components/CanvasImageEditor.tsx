'use client';

import { useReducer, useRef, useEffect, useCallback, useState } from 'react';
import { MapPin, BookOpen, Type, Calendar, Loader2, Download, X } from 'lucide-react';
import { suggestBiblicalVerse } from '@/app/actions/generateImage';
import { toast } from '@/components/ui/Toast';
import type { CanvasOverlay } from '@/lib/types';

// ─── State ───

type Action =
  | { type: 'SELECT'; id: string | null }
  | { type: 'MOVE'; id: string; x: number; y: number }
  | { type: 'RESIZE'; id: string; fontSize: number }
  | { type: 'TOGGLE'; id: string }
  | { type: 'UPDATE_TEXT'; id: string; text: string }
  | { type: 'UPDATE_COLOR'; id: string; color: string }
  | { type: 'SET_OVERLAYS'; overlays: CanvasOverlay[] };

interface State {
  overlays: CanvasOverlay[];
  selectedId: string | null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT':
      return { ...state, selectedId: action.id };
    case 'MOVE':
      return {
        ...state,
        overlays: state.overlays.map(o =>
          o.id === action.id ? { ...o, x: action.x, y: action.y } : o
        ),
      };
    case 'RESIZE':
      return {
        ...state,
        overlays: state.overlays.map(o =>
          o.id === action.id ? { ...o, fontSize: Math.max(12, Math.min(80, action.fontSize)) } : o
        ),
      };
    case 'TOGGLE':
      return {
        ...state,
        overlays: state.overlays.map(o =>
          o.id === action.id ? { ...o, visible: !o.visible } : o
        ),
      };
    case 'UPDATE_TEXT':
      return {
        ...state,
        overlays: state.overlays.map(o =>
          o.id === action.id ? { ...o, text: action.text } : o
        ),
      };
    case 'UPDATE_COLOR':
      return {
        ...state,
        overlays: state.overlays.map(o =>
          o.id === action.id ? { ...o, color: action.color } : o
        ),
      };
    case 'SET_OVERLAYS':
      return { ...state, overlays: action.overlays };
    default:
      return state;
  }
}

// ─── Component ───

interface CanvasImageEditorProps {
  imageUrl: string;
  location: string;
  experienceText: string;
  onExport: (dataUrl: string) => void;
  onClose?: () => void;
  verseText?: string;
  verseReference?: string;
}

export function CanvasImageEditor({
  imageUrl,
  location,
  experienceText,
  onExport,
  onClose,
  verseText,
  verseReference,
}: CanvasImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<string | null>(null);

  // Touch state refs (not in reducer to avoid re-renders during drag)
  const touchStartRef = useRef<{ id: string; x: number; y: number; startX: number; startY: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; fontSize: number } | null>(null);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const defaultOverlays: CanvasOverlay[] = [
    { id: 'location', type: 'location', text: location, x: 0.05, y: 0.92, fontSize: 28, color: '#ffffff', visible: true },
    { id: 'verse', type: 'verse', text: verseText || '', x: 0.05, y: 0.06, fontSize: 18, color: '#ffffff', visible: false },
    { id: 'experience', type: 'experience', text: experienceText.slice(0, 100), x: 0.05, y: 0.82, fontSize: 20, color: '#ffffff', visible: false },
    { id: 'date', type: 'date', text: today, x: 0.75, y: 0.06, fontSize: 16, color: '#ffffff', visible: false },
  ];

  const [state, dispatch] = useReducer(reducer, {
    overlays: defaultOverlays,
    selectedId: null,
  });

  // ── Load image ──
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Render canvas ──
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 1080;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Draw image (center crop to square)
    const imgAspect = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgAspect > 1) {
      sw = img.height;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

    // Draw overlays
    for (const overlay of state.overlays) {
      if (!overlay.visible || !overlay.text) continue;

      const x = overlay.x * size;
      const y = overlay.y * size;

      ctx.font = `bold ${overlay.fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillText(overlay.text, x + 2, y + 2);
      ctx.fillStyle = overlay.color;
      ctx.fillText(overlay.text, x, y);

      // Selection indicator
      if (state.selectedId === overlay.id) {
        const metrics = ctx.measureText(overlay.text);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          x - 4,
          y - overlay.fontSize - 2,
          metrics.width + 8,
          overlay.fontSize + 8
        );
        ctx.setLineDash([]);
      }
    }
  }, [state.overlays, state.selectedId]);

  useEffect(() => {
    if (loaded) render();
  }, [loaded, render]);

  // ── Touch handlers ──
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const findOverlayAt = (nx: number, ny: number): CanvasOverlay | null => {
    // Check from top (last drawn) to bottom
    for (let i = state.overlays.length - 1; i >= 0; i--) {
      const o = state.overlays[i];
      if (!o.visible) continue;
      // Approximate hit test
      const tolerance = 0.08;
      if (
        nx >= o.x - tolerance &&
        nx <= o.x + 0.5 &&
        ny >= o.y - tolerance &&
        ny <= o.y + tolerance
      ) {
        return o;
      }
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && state.selectedId) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const overlay = state.overlays.find(o => o.id === state.selectedId);
      pinchStartRef.current = { distance, fontSize: overlay?.fontSize || 24 };
      return;
    }

    if (e.touches.length === 1) {
      const { x, y } = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      const hit = findOverlayAt(x, y);

      if (hit) {
        dispatch({ type: 'SELECT', id: hit.id });
        touchStartRef.current = { id: hit.id, x: hit.x, y: hit.y, startX: x, startY: y };
      } else {
        dispatch({ type: 'SELECT', id: null });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && pinchStartRef.current && state.selectedId) {
      // Pinch resize
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / pinchStartRef.current.distance;
      const newSize = Math.round(pinchStartRef.current.fontSize * scale);
      dispatch({ type: 'RESIZE', id: state.selectedId, fontSize: newSize });
      return;
    }

    if (e.touches.length === 1 && touchStartRef.current) {
      const { x, y } = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      const dx = x - touchStartRef.current.startX;
      const dy = y - touchStartRef.current.startY;
      dispatch({
        type: 'MOVE',
        id: touchStartRef.current.id,
        x: Math.max(0, Math.min(1, touchStartRef.current.x + dx)),
        y: Math.max(0, Math.min(1, touchStartRef.current.y + dy)),
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    pinchStartRef.current = null;
  };

  // ── Mouse handlers (desktop) ──
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hit = findOverlayAt(x, y);

    if (hit) {
      dispatch({ type: 'SELECT', id: hit.id });
      touchStartRef.current = { id: hit.id, x: hit.x, y: hit.y, startX: x, startY: y };
    } else {
      dispatch({ type: 'SELECT', id: null });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartRef.current || e.buttons !== 1) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const dx = x - touchStartRef.current.startX;
    const dy = y - touchStartRef.current.startY;
    dispatch({
      type: 'MOVE',
      id: touchStartRef.current.id,
      x: Math.max(0, Math.min(1, touchStartRef.current.x + dx)),
      y: Math.max(0, Math.min(1, touchStartRef.current.y + dy)),
    });
  };

  const handleMouseUp = () => {
    touchStartRef.current = null;
  };

  // ── Double tap to edit ──
  const lastTapRef = useRef<{ time: number; id: string } | null>(null);
  const handleTap = (overlayId: string) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === overlayId && now - lastTapRef.current.time < 400) {
      setEditingOverlay(overlayId);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, id: overlayId };
    }
  };

  // Handle click on canvas (for double-tap detection)
  const handleCanvasClick = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hit = findOverlayAt(x, y);
    if (hit) handleTap(hit.id);
  };

  // ── Verse lazy load ──
  const handleToggleVerse = async () => {
    const verse = state.overlays.find(o => o.id === 'verse');
    if (verse && !verse.visible && !verse.text) {
      setLoadingVerse(true);
      try {
        const result = await suggestBiblicalVerse(location, experienceText);
        if (result.success && result.verse) {
          dispatch({ type: 'UPDATE_TEXT', id: 'verse', text: `"${result.verse}" — ${result.reference || ''}` });
        }
      } catch { /* ignore */ }
      setLoadingVerse(false);
    }
    dispatch({ type: 'TOGGLE', id: 'verse' });
  };

  // ── Export ──
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Re-render without selection indicator
    dispatch({ type: 'SELECT', id: null });
    // Use requestAnimationFrame to ensure render completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onExport(dataUrl);
      });
    });
  };

  const toggleButtons: { id: string; icon: React.ReactNode; label: string; onClick?: () => void }[] = [
    { id: 'location', icon: <MapPin size={14} />, label: 'Location' },
    { id: 'verse', icon: <BookOpen size={14} />, label: 'Verse', onClick: handleToggleVerse },
    { id: 'experience', icon: <Type size={14} />, label: 'Text' },
    { id: 'date', icon: <Calendar size={14} />, label: 'Date' },
  ];

  const selectedOverlay = state.overlays.find(o => o.id === editingOverlay);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        {onClose && (
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={24} />
          </button>
        )}
        <span className="text-white text-sm font-medium">Edit Photo</span>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          className="max-w-full max-h-full rounded-lg shadow-lg"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Toggle Controls */}
      <div className="px-4 py-3 bg-black/50">
        <div className="flex gap-2 justify-center flex-wrap">
          {toggleButtons.map(btn => {
            const overlay = state.overlays.find(o => o.id === btn.id);
            const isActive = overlay?.visible ?? false;
            return (
              <button
                key={btn.id}
                onClick={btn.onClick || (() => dispatch({ type: 'TOGGLE', id: btn.id }))}
                disabled={loadingVerse && btn.id === 'verse'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? 'bg-white text-gray-900 border-white'
                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                }`}
              >
                {loadingVerse && btn.id === 'verse' ? <Loader2 size={14} className="animate-spin" /> : btn.icon}
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Edit Modal (Bottom Sheet) */}
      {editingOverlay && selectedOverlay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 capitalize">{selectedOverlay.type} Text</h3>
              <button onClick={() => setEditingOverlay(null)} className="text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>

            <textarea
              value={selectedOverlay.text}
              onChange={(e) => dispatch({ type: 'UPDATE_TEXT', id: selectedOverlay.id, text: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none"
            />

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Color:</label>
              <input
                type="color"
                value={selectedOverlay.color}
                onChange={(e) => dispatch({ type: 'UPDATE_COLOR', id: selectedOverlay.id, color: e.target.value })}
                className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
              />
              <label className="text-sm text-gray-600 ml-4">Size:</label>
              <input
                type="range"
                min={12}
                max={60}
                value={selectedOverlay.fontSize}
                onChange={(e) => dispatch({ type: 'RESIZE', id: selectedOverlay.id, fontSize: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-6">{selectedOverlay.fontSize}</span>
            </div>

            <button
              onClick={() => setEditingOverlay(null)}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
