interface Landmark {
  id: number;
  name: string;
  country: string;
  imageUrl: string;
  votes: bigint;
  latMicro: bigint;
  lngMicro: bigint;
}

interface LandmarkCardProps {
  landmark: Landmark;
  onClick: () => void;
}

export function LandmarkCard({ landmark, onClick }: LandmarkCardProps) {
  return (
    <div
      onClick={onClick}
      className="group backdrop-blur-xl bg-white/10 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-pointer transform hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300"
    >
      {/* 图片区域 */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={landmark.imageUrl || "https://via.placeholder.com/400x300?text=Beautiful+Place"}
          alt={landmark.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* 排名标识（可选） */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold shadow-lg">
          #{landmark.id}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6 space-y-4">
        {/* 标题和国家 */}
        <div>
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
            {landmark.name}
          </h3>
          <p className="text-lg text-purple-200 flex items-center gap-2">
            <span>📍</span>
            {landmark.country}
          </p>
        </div>

        {/* 分隔线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

        {/* 票数（需解密）和按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔒</div>
            <div className="text-sm text-purple-300">票数（需解密）</div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300"
          >
            查看详情
          </button>
        </div>

        {/* 坐标（小字） */}
        <div className="text-xs text-purple-300 flex items-center justify-between pt-2 border-t border-white/10">
          <span>🧭 {(Number(landmark.latMicro) / 1e6).toFixed(4)}°N</span>
          <span>🌍 {(Number(landmark.lngMicro) / 1e6).toFixed(4)}°E</span>
        </div>
      </div>
    </div>
  );
}
