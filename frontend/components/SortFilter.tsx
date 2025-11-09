type SortOption = "votes" | "newest" | "country";

interface SortFilterProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortFilter({ value, onChange }: SortFilterProps) {
  const options: { value: SortOption; label: string; icon: string }[] = [
    { value: "votes", label: "票数最高", icon: "🏆" },
    { value: "newest", label: "最新添加", icon: "🆕" },
    { value: "country", label: "按国家", icon: "🌏" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-6 py-4 font-semibold rounded-xl transition-all duration-300 ${
            value === option.value
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
              : "bg-white/20 backdrop-blur-sm text-purple-200 hover:bg-white/30 border border-white/20"
          }`}
        >
          <span className="mr-2">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
}

