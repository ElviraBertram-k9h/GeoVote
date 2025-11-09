"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useMetaMaskEthersSigner } from "@/hooks/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useGeoVote } from "@/hooks/useGeoVote";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

export default function LandmarkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const landmarkId = Number(params.id);

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
    voteLandmark,
    decryptVotes,
    grantViewVotes,
    hasVoted,
    isVoting,
    isDecrypting,
    message,
  } = useGeoVote({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
  });

  const landmark = landmarks.find((lm) => lm.id === landmarkId);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [decryptedVotes, setDecryptedVotes] = useState<bigint | null>(null);

  useEffect(() => {
    if (landmark && ethersSigner) {
      hasVoted(landmarkId, ethersSigner.address).then(setUserHasVoted);
    }
  }, [landmark, ethersSigner, landmarkId, hasVoted]);

  const handleVote = async () => {
    await voteLandmark(landmarkId);
    setUserHasVoted(true);
  };

  const handleDecrypt = async () => {
    // 先授权查看
    await grantViewVotes(landmarkId);
    // 再解密
    const result = await decryptVotes(landmarkId);
    if (result !== null) {
      setDecryptedVotes(result);
    }
  };

  // 推荐相邻地标
  const nearbyLandmarks = landmarks
    .filter((lm) => lm.id !== landmarkId && lm.country === landmark?.country)
    .slice(0, 3);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
        <Navbar isConnected={false} onConnect={connect} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-2xl text-white mb-4">请先连接钱包</p>
            <button
              onClick={connect}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full"
            >
              连接 MetaMask
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!landmark) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
        <Navbar isConnected={isConnected} onConnect={connect} />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-2xl text-white mb-8">地标不存在</p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full"
          >
            返回首页
          </button>
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

      <Navbar isConnected={isConnected} onConnect={connect} />

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push("/")}
          className="mb-8 px-6 py-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20"
        >
          ← 返回地标列表
        </button>

        {/* 主卡片 */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl overflow-hidden shadow-2xl border border-white/20 mb-12">
          {/* 大图 */}
          <div className="relative h-96 overflow-hidden">
            <img
              src={landmark.imageUrl || "https://via.placeholder.com/800x400?text=No+Image"}
              alt={landmark.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-5xl font-black text-white mb-2">
                {landmark.name}
              </h1>
              <p className="text-2xl text-purple-200 flex items-center gap-2">
                <span>📍</span>
                {landmark.country}
              </p>
            </div>
          </div>

          {/* 详情内容 */}
          <div className="p-8 space-y-8">
            {/* 位置信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="text-3xl mb-2">{decryptedVotes !== null ? "🔓" : "🔒"}</div>
                <div className="text-sm text-purple-300 mb-1">
                  {decryptedVotes !== null ? "票数（已解密）" : "票数（需解密）"}
                </div>
                <div className="text-3xl font-bold text-white">
                  {decryptedVotes !== null ? decryptedVotes.toString() : "——"}
                </div>
              </div>
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="text-3xl mb-2">🌍</div>
                <div className="text-sm text-purple-300 mb-1">经度</div>
                <div className="text-xl font-semibold text-white">
                  {(Number(landmark.lngMicro) / 1e6).toFixed(6)}°
                </div>
              </div>
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="text-3xl mb-2">🧭</div>
                <div className="text-sm text-purple-300 mb-1">纬度</div>
                <div className="text-xl font-semibold text-white">
                  {(Number(landmark.latMicro) / 1e6).toFixed(6)}°
                </div>
              </div>
            </div>

            {/* 投票状态 */}
            {userHasVoted && (
              <div className="backdrop-blur-xl bg-green-500/20 border-2 border-green-400/50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-xl text-green-200 font-semibold">
                  您已为这个地标投票
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={handleVote}
                disabled={isVoting || userHasVoted}
                className={`flex-1 px-12 py-6 text-xl font-bold rounded-xl shadow-lg transform transition-all duration-300 ${
                  userHasVoted
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105"
                } text-white`}
              >
                {isVoting ? "⏳ 投票中..." : userHasVoted ? "已投票" : "🗳️ 为此地标投票"}
              </button>

              <button
                onClick={handleDecrypt}
                disabled={isDecrypting}
                className="flex-1 px-12 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDecrypting ? "⏳ 解密中..." : "🔓 解密加密票数"}
              </button>
            </div>

            {/* 解密结果 */}
            {decryptedVotes !== null && (
              <div className="backdrop-blur-xl bg-purple-500/20 border-2 border-purple-400/50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">🔐</div>
                <p className="text-lg text-purple-200 mb-2">加密票数（已解密）</p>
                <p className="text-4xl text-white font-bold">
                  {decryptedVotes.toString()}
                </p>
              </div>
            )}

            {/* 消息提示 */}
            {message && (
              <div className="backdrop-blur-xl bg-blue-500/20 border border-blue-400/50 rounded-2xl p-4 text-center">
                <p className="text-blue-200">{message}</p>
              </div>
            )}
          </div>
        </div>

        {/* 相邻地标推荐 */}
        {nearbyLandmarks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              🌟 来自 {landmark.country} 的其他地标
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nearbyLandmarks.map((nearby) => (
                <div
                  key={nearby.id}
                  onClick={() => router.push(`/landmark/${nearby.id}`)}
                  className="backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden border border-white/20 cursor-pointer hover:scale-105 transition-transform duration-300 group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={nearby.imageUrl || "https://via.placeholder.com/400x200"}
                      alt={nearby.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {nearby.name}
                    </h3>
                    <p className="text-sm text-purple-300">
                      🗳️ {nearby.votes.toString()} 票
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

