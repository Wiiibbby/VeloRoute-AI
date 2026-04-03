import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { searchPlaces, Place } from '../services/route';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (place: Place) => void;
  placeholder: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export default function AutocompleteInput({ value, onChange, onSelect, placeholder, icon, rightElement }: Props) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (skipNextFetch.current) {
        skipNextFetch.current = false;
        return;
      }
      
      if (!value || value.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      
      setIsLoading(true);
      const results = await searchPlaces(value);
      setSuggestions(results);
      setIsLoading(false);
      setIsOpen(true);
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div ref={wrapperRef} className="relative flex items-center w-full">
      {icon || <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
      />
      {rightElement}

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto custom-scrollbar">
              {suggestions.map((place, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    skipNextFetch.current = true;
                    onSelect(place);
                    setIsOpen(false);
                  }}
                  className="px-4 py-3 hover:bg-slate-700 cursor-pointer flex items-start gap-3 border-b border-slate-700/50 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-slate-200 truncate">{place.name}</span>
                    <span className="text-xs text-slate-400 truncate">{place.address}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
