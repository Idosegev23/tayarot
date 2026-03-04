'use client';

import { useReducer, useRef, useState } from 'react';
import { parseItineraryFile, saveItinerary } from '@/app/actions/itineraryActions';
import { Card, CardContent } from '@/components/ui/Card';
import { LOCATIONS, POINTS_OF_INTEREST } from '@/lib/constants';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Upload, Save,
  MapPin, Clock, FileText, Loader2,
} from 'lucide-react';
import type { ItineraryDayDraft, ItineraryStopDraft } from '@/lib/types';

// Merge all known locations for autocomplete
const ALL_LOCATIONS = [
  ...LOCATIONS.map(l => ({ name: l.name, lat: l.lat, lng: l.lng })),
  ...POINTS_OF_INTEREST.map(p => ({ name: p.name, lat: p.lat, lng: p.lng })),
];

// ─── State ───

type Action =
  | { type: 'SET_DAYS'; days: ItineraryDayDraft[] }
  | { type: 'ADD_DAY' }
  | { type: 'REMOVE_DAY'; index: number }
  | { type: 'UPDATE_DAY'; index: number; field: string; value: string }
  | { type: 'ADD_STOP'; dayIndex: number }
  | { type: 'REMOVE_STOP'; dayIndex: number; stopIndex: number }
  | { type: 'UPDATE_STOP'; dayIndex: number; stopIndex: number; field: string; value: string | number | undefined }
  | { type: 'REORDER_STOP'; dayIndex: number; from: number; to: number };

function newTempId() {
  return Math.random().toString(36).slice(2, 10);
}

function reducer(state: ItineraryDayDraft[], action: Action): ItineraryDayDraft[] {
  switch (action.type) {
    case 'SET_DAYS':
      return action.days;

    case 'ADD_DAY':
      return [
        ...state,
        {
          tempId: newTempId(),
          day_number: state.length + 1,
          stops: [],
        },
      ];

    case 'REMOVE_DAY':
      return state
        .filter((_, i) => i !== action.index)
        .map((d, i) => ({ ...d, day_number: i + 1 }));

    case 'UPDATE_DAY':
      return state.map((d, i) =>
        i === action.index ? { ...d, [action.field]: action.value } : d
      );

    case 'ADD_STOP': {
      return state.map((d, i) =>
        i === action.dayIndex
          ? {
              ...d,
              stops: [
                ...d.stops,
                {
                  tempId: newTempId(),
                  order_index: d.stops.length,
                  location_name: '',
                },
              ],
            }
          : d
      );
    }

    case 'REMOVE_STOP':
      return state.map((d, i) =>
        i === action.dayIndex
          ? {
              ...d,
              stops: d.stops
                .filter((_, si) => si !== action.stopIndex)
                .map((s, si) => ({ ...s, order_index: si })),
            }
          : d
      );

    case 'UPDATE_STOP':
      return state.map((d, i) =>
        i === action.dayIndex
          ? {
              ...d,
              stops: d.stops.map((s, si) =>
                si === action.stopIndex ? { ...s, [action.field]: action.value } : s
              ),
            }
          : d
      );

    case 'REORDER_STOP': {
      return state.map((d, i) => {
        if (i !== action.dayIndex) return d;
        const stops = [...d.stops];
        const [moved] = stops.splice(action.from, 1);
        stops.splice(action.to, 0, moved);
        return { ...d, stops: stops.map((s, si) => ({ ...s, order_index: si })) };
      });
    }

    default:
      return state;
  }
}

// ─── Component ───

interface ItineraryBuilderProps {
  groupId: string;
  initialDays?: ItineraryDayDraft[];
  onSaved?: () => void;
}

export function ItineraryBuilder({ groupId, initialDays, onSaved }: ItineraryBuilderProps) {
  const [days, dispatch] = useReducer(reducer, initialDays || []);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File Upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File too large (max 10MB)');
      return;
    }

    setParsing(true);
    setError('');
    setSuccess('');

    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const result = await parseItineraryFile(base64, file.type, file.name);

      if (result.success && result.itinerary) {
        const parsed: ItineraryDayDraft[] = result.itinerary.days.map(d => ({
          tempId: newTempId(),
          day_number: d.day_number,
          date: d.date,
          title: d.title,
          stops: (d.stops || []).map((s, si) => ({
            tempId: newTempId(),
            order_index: si,
            location_name: s.location_name,
            time: s.time,
            duration_minutes: s.duration_minutes,
            description: s.description,
            fun_facts: s.fun_facts,
            lat: s.lat,
            lng: s.lng,
          })),
        }));
        dispatch({ type: 'SET_DAYS', days: parsed });
        setSuccess(`Parsed ${parsed.length} days from file. Review and save.`);
      } else {
        setError(result.error || 'Failed to parse file');
      }
    } catch {
      setError('Failed to read file');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (days.length === 0) {
      setError('Add at least one day');
      return;
    }

    // Validate
    for (const day of days) {
      for (const stop of day.stops) {
        if (!stop.location_name.trim()) {
          setError(`Day ${day.day_number}: All stops need a location name`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const result = await saveItinerary(groupId, days);

    setSaving(false);

    if (result.success) {
      setSuccess('Itinerary saved!');
      onSaved?.();
    } else {
      setError(result.error || 'Failed to save');
    }
  };

  // ── Location autocomplete helper ──
  const matchLocations = (query: string) => {
    if (!query || query.length < 2) return [];
    const lower = query.toLowerCase();
    return ALL_LOCATIONS.filter(l => l.name.toLowerCase().includes(lower)).slice(0, 5);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.text"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {parsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {parsing ? 'Parsing...' : 'Upload File'}
        </button>

        <button
          onClick={() => dispatch({ type: 'ADD_DAY' })}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Plus size={16} />
          Add Day
        </button>

        <button
          onClick={handleSave}
          disabled={saving || days.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 ml-auto"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Itinerary'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">{success}</div>
      )}

      {/* Days */}
      {days.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No itinerary yet</p>
            <p className="text-sm text-gray-400">Upload a file or add days manually</p>
          </CardContent>
        </Card>
      ) : (
        days.map((day, dayIndex) => (
          <DayCard
            key={day.tempId}
            day={day}
            dayIndex={dayIndex}
            dispatch={dispatch}
            matchLocations={matchLocations}
            totalDays={days.length}
          />
        ))
      )}
    </div>
  );
}

// ─── DayCard ───

function DayCard({
  day,
  dayIndex,
  dispatch,
  matchLocations,
  totalDays,
}: {
  day: ItineraryDayDraft;
  dayIndex: number;
  dispatch: React.Dispatch<Action>;
  matchLocations: (q: string) => { name: string; lat: number; lng: number }[];
  totalDays: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
          {day.day_number}
        </span>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={day.title || ''}
            onChange={(e) => {
              e.stopPropagation();
              dispatch({ type: 'UPDATE_DAY', index: dayIndex, field: 'title', value: e.target.value });
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder={`Day ${day.day_number} title`}
            className="w-full text-sm font-medium bg-transparent border-none outline-none placeholder:text-gray-400"
          />
        </div>
        <input
          type="date"
          value={day.date || ''}
          onChange={(e) => {
            e.stopPropagation();
            dispatch({ type: 'UPDATE_DAY', index: dayIndex, field: 'date', value: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1"
        />
        <span className="text-xs text-gray-400">{day.stops.length} stops</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'REMOVE_DAY', index: dayIndex });
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {!collapsed && (
        <CardContent className="pt-0 space-y-3">
          {day.stops.map((stop, stopIndex) => (
            <StopCard
              key={stop.tempId}
              stop={stop}
              dayIndex={dayIndex}
              stopIndex={stopIndex}
              dispatch={dispatch}
              matchLocations={matchLocations}
              totalStops={day.stops.length}
            />
          ))}

          <button
            onClick={() => dispatch({ type: 'ADD_STOP', dayIndex })}
            className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={14} />
            Add Stop
          </button>
        </CardContent>
      )}
    </Card>
  );
}

// ─── StopCard ───

function StopCard({
  stop,
  dayIndex,
  stopIndex,
  dispatch,
  matchLocations,
  totalStops,
}: {
  stop: ItineraryStopDraft;
  dayIndex: number;
  stopIndex: number;
  dispatch: React.Dispatch<Action>;
  matchLocations: (q: string) => { name: string; lat: number; lng: number }[];
  totalStops: number;
}) {
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateField = (field: string, value: string | number | undefined) => {
    dispatch({ type: 'UPDATE_STOP', dayIndex, stopIndex, field, value });
  };

  const handleLocationChange = (value: string) => {
    updateField('location_name', value);
    const matches = matchLocations(value);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const selectSuggestion = (loc: { name: string; lat: number; lng: number }) => {
    updateField('location_name', loc.name);
    updateField('lat', loc.lat);
    updateField('lng', loc.lng);
    setShowSuggestions(false);
  };

  return (
    <div className="relative bg-gray-50 rounded-xl p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
          {stopIndex + 1}
        </div>

        {/* Location with autocomplete */}
        <div className="flex-1 relative">
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={stop.location_name}
              onChange={(e) => handleLocationChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Location name"
              className="w-full text-sm bg-transparent border-none outline-none placeholder:text-gray-400"
            />
          </div>
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onMouseDown={() => selectSuggestion(loc)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-gray-400" />
          <input
            type="time"
            value={stop.time || ''}
            onChange={(e) => updateField('time', e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-24"
          />
        </div>

        {/* Duration */}
        <input
          type="number"
          value={stop.duration_minutes || ''}
          onChange={(e) => updateField('duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="min"
          min={0}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-16 text-center"
        />

        {/* Reorder */}
        <div className="flex flex-col">
          <button
            disabled={stopIndex === 0}
            onClick={() => dispatch({ type: 'REORDER_STOP', dayIndex, from: stopIndex, to: stopIndex - 1 })}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            disabled={stopIndex === totalStops - 1}
            onClick={() => dispatch({ type: 'REORDER_STOP', dayIndex, from: stopIndex, to: stopIndex + 1 })}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={() => dispatch({ type: 'REMOVE_STOP', dayIndex, stopIndex })}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Description row */}
      <input
        type="text"
        value={stop.description || ''}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Description (optional)"
        className="w-full text-xs bg-transparent border-none outline-none placeholder:text-gray-400 pl-8"
      />
    </div>
  );
}
