interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "搜索..." }: SearchBarProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">
        🔍
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-14 pr-6 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all text-lg"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-red-400 transition-colors"
        >
          ❌
        </button>
      )}
    </div>
  );
}

