'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { ArrowRight, Check, Sparkles, Figma, Github, Globe, MessageSquare } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { MockCanvas } from '@/components/landing/MockCanvas';
import { MediaEngineSection } from '@/components/landing/MediaEngineSection';
import { ProductRoadmap } from '@/components/landing/ProductRoadmap';

interface MousePosition {
  x: number;
  y: number;
  parallaxX: number;
  parallaxY: number;
}

export default function LandingPage() {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0, parallaxX: 0, parallaxY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState<string>('');
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        setMousePos({
          x: e.clientX,
          y: e.clientY,
          parallaxX: (e.clientX - window.innerWidth / 2) * 0.01,
          parallaxY: (e.clientY - window.innerHeight / 2) * 0.01,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#020617] text-slate-300 font-sans overflow-x-hidden relative selection:bg-cyan-500/30 selection:text-cyan-50"
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            filter: 'contrast(120%)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            transform: `perspective(1000px) rotateX(20deg) translate(${mousePos.parallaxX}px, ${mousePos.parallaxY}px)`,
            maskImage: 'radial-gradient(circle at center, black 0%, transparent 85%)',
          }}
        />
      </div>

      {/* Navigation */}
      <LandingNavbar />

      <main className="relative z-10 w-full min-h-screen pt-32 pb-20 px-4">
        {/* Hero section */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center mb-32">
          <div className="text-left relative z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-950/30 text-[10px] font-bold text-indigo-300 mb-8 tracking-widest uppercase">
              <Sparkles size={10} />
              <span>Spatial Workspace v1.0</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
              The infinite <br /> paper for your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                digital mind.
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed font-light">
              Linear docs are for finishing ideas. Notera is for finding them. Drag, drop, and
              connect your thoughts on an infinite spatial plane.
            </p>
            {!isSignedIn ? (
              <form
                onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()}
                className="flex flex-col sm:flex-row gap-3 max-w-md"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="test@email.com"
                  className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-colors placeholder-slate-500"
                />
                <button className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  Join Beta <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
                <Check size={16} />
                Access granted.
              </div>
            )}
          </div>

          {/* Interactive Canvas */}
          <div className="relative h-[500px] perspective-[1000px] group">
            <div className="absolute inset-0 rounded-3xl border border-white/10 bg-[#0f172a]/40 backdrop-blur-sm overflow-hidden shadow-2xl ring-1 ring-white/5 transition-colors duration-500 hover:border-indigo-500/30">
              <div className="absolute top-4 left-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest pointer-events-none z-20">
                Interactive Preview
              </div>
              <div className="absolute inset-0 pt-10">
                <MockCanvas />
              </div>
            </div>
          </div>
        </div>

        {/* Native Media Engine */}
        <MediaEngineSection />

        {/* Product Roadmap */}
        <ProductRoadmap />

        {/* Integrations */}
        <section id="integrations" className="w-full max-w-4xl mx-auto mb-32 text-center">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10">
            Works with your stack
          </h2>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-colors duration-500">
            <div className="flex items-center gap-2 text-white">
              <Github size={24} /> <span className="font-bold">GitHub</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Figma size={24} /> <span className="font-bold">Figma</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Globe size={24} /> <span className="font-bold">Linear</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <MessageSquare size={24} /> <span className="font-bold">Slack</span>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      <style>{`
        @keyframes scroll-slow {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-slow {
          animation: scroll-slow 20s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
