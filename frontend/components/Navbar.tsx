"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
  isConnected: boolean;
  onConnect: () => void;
  address?: string;
}

export function Navbar({ isConnected, onConnect, address }: NavbarProps) {
  const router = useRouter();

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="relative z-20 backdrop-blur-xl bg-white/10 border-b-2 border-white/20 shadow-2xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo 和标题 */}
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
              🌍
            </div>
            <div>
              <h1 className="text-3xl font-black text-white group-hover:text-purple-300 transition-colors">
                GeoVote
              </h1>
              <p className="text-sm text-purple-200">世界最美地标投票</p>
            </div>
          </div>

          {/* 右侧按钮区 */}
          <div className="flex items-center gap-4">
            {/* FHEVM 状态指示 */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-200">Powered by FHEVM</span>
            </div>

            {/* 连接按钮 */}
            {!isConnected ? (
              <button
                onClick={onConnect}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <span>🦊</span>
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg border-2 border-white/30 flex items-center gap-3">
                <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
                <div>
                  <div className="text-xs text-green-100">已连接</div>
                  <div className="text-sm font-bold text-white">
                    {address ? shortenAddress(address) : "Connected"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
