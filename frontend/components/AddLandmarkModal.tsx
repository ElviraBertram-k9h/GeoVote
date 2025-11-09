"use client";

import { useState } from "react";

interface AddLandmarkModalProps {
  onClose: () => void;
  onAdd: (name: string, country: string, imageUrl: string, latMicro: number, lngMicro: number) => Promise<boolean>;
  busy?: boolean;
}

export function AddLandmarkModal({ onClose, onAdd, busy = false }: AddLandmarkModalProps) {

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    imageUrl: "",
    lat: "",
    lng: "",
  });

  const [previewImage, setPreviewImage] = useState<string>("");

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    setPreviewImage(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      alert("请输入有效的经纬度");
      return;
    }

    if (latNum < -90 || latNum > 90) {
      alert("纬度必须在 -90 到 90 之间");
      return;
    }

    if (lngNum < -180 || lngNum > 180) {
      alert("经度必须在 -180 到 180 之间");
      return;
    }

    const latMicro = Math.round(latNum * 1e6);
    const lngMicro = Math.round(lngNum * 1e6);

    const success = await onAdd(
      formData.name,
      formData.country,
      formData.imageUrl,
      latMicro,
      lngMicro
    );

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-gradient-to-br from-purple-900/90 to-indigo-900/90 rounded-3xl shadow-2xl border-2 border-white/20">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-red-500/80 hover:bg-red-600 text-white rounded-full text-2xl transition-all duration-300 hover:scale-110 z-10"
        >
          ✕
        </button>

        <div className="p-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🌍</div>
            <h2 className="text-4xl font-black text-white mb-2">新增地标</h2>
            <p className="text-purple-200">添加一个美丽的地方到世界地图</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 地标名称 */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                📍 地标名称 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：埃菲尔铁塔"
                className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all text-lg"
              />
            </div>

            {/* 国家 */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                🌏 国家/地区 *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="例如：法国"
                className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all text-lg"
              />
            </div>

            {/* 图片 URL */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                🖼️ 图片 URL *
              </label>
              <input
                type="url"
                required
                value={formData.imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all text-lg"
              />
            </div>

            {/* 图片预览 */}
            {previewImage && (
              <div className="rounded-2xl overflow-hidden border-2 border-white/30">
                <img
                  src={previewImage}
                  alt="预览"
                  className="w-full h-64 object-cover"
                  onError={() => setPreviewImage("")}
                />
              </div>
            )}

            {/* 经纬度 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2 text-lg">
                  🧭 纬度 *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  placeholder="48.8584"
                  className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all text-lg"
                />
                <p className="text-xs text-purple-300 mt-1">范围: -90 到 90</p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-lg">
                  🌍 经度 *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  placeholder="2.2945"
                  className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all text-lg"
                />
                <p className="text-xs text-purple-300 mt-1">范围: -180 到 180</p>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg rounded-xl transition-all duration-300"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {busy ? "⏳ 添加中..." : "✅ 添加地标"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

