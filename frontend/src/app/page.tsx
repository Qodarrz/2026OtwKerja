'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { LogOut, User as UserIcon, Shield, LogIn, UserPlus , ExternalLink } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">UNTAR AUTH</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {user?.name?.[0] || user?.email?.[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-all shadow-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-400 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            System Online & Secure
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-gray-500">
            Authentication for <br />
            Modern Applications
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10 leading-relaxed">
            A secure boilerplate with NestJS, Prisma, and Next.js. 
            Includes JWT, Google OAuth 2.0, and a clean modular architecture.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <div className="p-6 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl max-w-sm w-full text-left">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-purple-500" />
                  Your Session Detail
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                    <p className="text-gray-200">{user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                    <p className="text-gray-200">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Provider</p>
                    <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold">
                      {user?.provider}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-linear-to-r from-purple-600 to-blue-600 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-purple-600/20"
                >
                  <UserPlus className="w-5 h-5" />
                  Get Started Free
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  Live Demo
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Next.js 16",
              desc: "Latest React 19 features with App Router and server-side magic.",
              icon: <ExternalLink className="w-6 h-6" />
            },
            {
              title: "NestJS Backend",
              desc: "Scalable, modular architecture for industrial-grade APIs.",
              icon: <Shield className="w-6 h-6" />
            },
            {
              title: "Database Ready",
              desc: "PostgreSQL with Prisma ORM for type-safe database access.",
              icon: <UserPlus className="w-6 h-6" />
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all group">
              <div className="w-12 h-12 bg-purple-600/10 border border-purple-600/20 rounded-xl flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-gray-500 text-sm">
        <p>© 2026 UNTAR Competition Project. Built with Antigravity.</p>
      </footer>
    </main>
  );
}
