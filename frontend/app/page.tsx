"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LandmarkCard } from "@/components/LandmarkCard";
import { SearchBar } from "@/components/SearchBar";
import { SortFilter } from "@/components/SortFilter";
import { AddLandmarkModal } from "@/components/AddLandmarkModal";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useGeoVote } from "@/hooks/useGeoVote";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

type SortOption = "votes" | "newest" | "country";

export default function HomePage() {
  const router = useRouter();
  const { storage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: true,
  });

  const {
    landmarks,
    isLoading,
    isAdmin,
    refreshLandmarks,
    addLandmark,
    isAdding,
  } = useGeoVote({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("votes");
  const [showAddModal, setShowAddModal] = useState(false);

  // 搜索和排序
  const filteredAndSortedLandmarks = useMemo(() => {
    let result = [...landmarks];

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lm) =>
          lm.name.toLowerCase().includes(query) ||
          lm.country.toLowerCase().includes(query)
      );
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === "votes") {
        return Number(b.votes) - Number(a.votes);
      } else if (sortBy === "newest") {
        return b.id - a.id;
      } else if (sortBy === "country") {
        return a.country.localeCompare(b.country);
      }
      return 0;
    });

    return result;
  }, [landmarks, searchQuery, sortBy]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* 星空背景 */}
        <div className="absolute inset-0 opacity-30">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
        </div>

        <Navbar isConnected={false} onConnect={connect} />

        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-8 px-4">
            <div className="text-8xl mb-8 animate-bounce">🌍</div>
            <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              GeoVote
            </h1>
            <p className="text-2xl text-purple-200 mb-8">
              Vote Your Most Beautiful Place
            </p>
            <button
              onClick={connect}
              className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl font-bold rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 hover:shadow-purple-500/50"
            >
              🔗 连接 MetaMask
            </button>
            <p className="text-sm text-purple-300 mt-4">
              {fhevmStatus === "ready"
                ? "✅ FHEVM 已就绪"
                : fhevmStatus === "loading"
                ? "⏳ 加载 FHEVM..."
                : "⚡ 等待连接"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* 星空背景 */}
      <div className="absolute inset-0 opacity-20">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* 世界地图背景 */}
      <div
        className="absolute inset-0 opacity-5 bg-cover bg-center"
        style={{
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgxMDAwdjUwMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMDAgMjAwbDUwLTMwIDQwIDIwIDYwLTEwIDQwIDMwIDUwLTIwIDMwIDQwIDcwLTEwIDQwIDIwIDUwLTMwIDYwIDEwIDQwLTIwIDUwIDMwIDMwLTEwIDQwIDIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+')",
        }}
      />

      <Navbar isConnected={isConnected} onConnect={connect} />

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
        {/* 标题区 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4">
            🌍{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Vote Your Most Beautiful Place
            </span>
          </h1>
          <p className="text-xl text-purple-200">
            所有投票链上存证，公开透明不可篡改
            {chainId === 31337 && " • 本地用 FHE Mock"}
            {chainId === 11155111 && " • Sepolia 用 Relayer SDK"}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-purple-300">
            <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              FHEVM: {fhevmStatus}
            </span>
            <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              地标总数: {landmarks.length}
            </span>
            {isAdmin && (
              <span className="px-4 py-2 rounded-full bg-yellow-500/20 backdrop-blur-sm text-yellow-300">
                👑 管理员
              </span>
            )}
          </div>
        </div>

        {/* 搜索和过滤区 */}
        <div className="mb-12 backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1 w-full">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索地标名称或国家..."
              />
            </div>
            <div className="flex gap-4 items-center">
              <SortFilter value={sortBy} onChange={setSortBy} />
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!isAdmin}
                className={`px-8 py-4 font-bold rounded-xl shadow-lg whitespace-nowrap transition-all duration-300 ${
                  isAdmin
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transform hover:scale-105"
                    : "bg-white/20 text-purple-200 cursor-not-allowed border border-white/20"
                }`}
                title={isAdmin ? "新增地标" : "仅管理员可添加地标（使用部署合约的钱包）"}
              >
                ➕ 新增地标{!isAdmin ? "（仅管理员）" : ""}
              </button>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
            <p className="text-purple-200 text-xl">加载地标中...</p>
          </div>
        )}

        {/* 地标网格 */}
        {!isLoading && filteredAndSortedLandmarks.length === 0 && (
          <div className="text-center py-20 backdrop-blur-xl bg-white/10 rounded-3xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-2xl text-purple-200">
              {searchQuery ? "未找到匹配的地标" : "暂无地标，等待管理员添加"}
            </p>
          </div>
        )}

        {!isLoading && filteredAndSortedLandmarks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedLandmarks.map((landmark) => (
              <LandmarkCard
                key={landmark.id}
                landmark={landmark}
                onClick={() => router.push(`/landmark/${landmark.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 新增地标模态框 */}
      {showAddModal && (
        <AddLandmarkModal
          onClose={() => {
            setShowAddModal(false);
            refreshLandmarks();
          }}
          onAdd={async (name, country, imageUrl, latMicro, lngMicro) => {
            const ok = await addLandmark(name, country, imageUrl, latMicro, lngMicro);
            if (ok) {
              await refreshLandmarks();
            }
            return ok;
          }}
          busy={isAdding}
        />
      )}
    </div>
  );
}
