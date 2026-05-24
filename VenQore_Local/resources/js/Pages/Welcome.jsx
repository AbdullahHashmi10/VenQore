import {
    ArrowRight, Sparkles, BarChart3, Package, Users,
    Zap, WifiOff, Brain, TrendingUp, Layers, MousePointer2
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// --- COMPATIBILITY LAYER ---
import { Head, Link } from '@inertiajs/react';

// --- HELPER: Safe Route ---
const safeRoute = (name) => {
    return route ? route(name) : '/' + name;
};

// --- VISUAL COMPONENTS ---

const NebulaBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020010]">
        <div className="absolute inset-0 bg-[#020010]" />

        {/* Animated Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-slow mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-violet-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen" />

        {/* Cinematic Grid Floor */}
        <div
            className="absolute inset-0 opacity-20 transform-gpu"
            style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '120px 120px',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                perspective: '1000px'
            }}
        />

        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />

        <style>{`
            @keyframes float-particle {
                0% { transform: translateY(0) translateX(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100px) translateX(50px); opacity: 0; }
            }
            .animate-float-particle { animation: float-particle 8s linear infinite; }
            
            @keyframes pulse-slow {
                0%, 100% { opacity: 0.2; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(1.05); }
            }
            .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
            
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            
            .text-glow { text-shadow: 0 0 30px rgba(139, 92, 246, 0.4); }
            
            @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
            }
            .animate-shimmer {
                background-size: 200% auto;
                animation: shimmer 8s linear infinite;
            }
        `}</style>
    </div>
);

const CustomCursor = () => {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const onMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };
        window.addEventListener('mousemove', onMouseMove);
        return () => window.removeEventListener('mousemove', onMouseMove);
    }, []);

    useEffect(() => {
        let animationFrame;
        const follower = followerRef.current;
        let px = 0;
        let py = 0;

        const loop = () => {
            px += (position.x - px) * 0.12;
            py += (position.y - py) * 0.12;
            if (follower) {
                follower.style.transform = `translate3d(${px - 24}px, ${py - 24}px, 0)`;
            }
            animationFrame = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animationFrame);
    }, [position]);

    return (
        <>
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{ marginTop: -4, marginLeft: -4 }}
            />
            <div
                ref={followerRef}
                className="fixed top-0 left-0 w-12 h-12 border border-white/20 rounded-full pointer-events-none z-[9998] transition-opacity duration-300 flex items-center justify-center mix-blend-overlay"
            >
                <div className="w-1 h-1 bg-white/50 rounded-full" />
            </div>
        </>
    );
};

// Compact 3D Card for Grid Layouts
const FeatureCard = ({ icon: Icon, title, description, colorClass, glowColor }) => {
    const cardRef = useRef(null);
    const glowRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current || !glowRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Subtler rotation for smaller cards
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        glowRef.current.style.opacity = '1';
        glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.2), transparent 70%)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current || !glowRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        glowRef.current.style.opacity = '0';
    };

    return (
        <div
            className="group relative w-full h-full min-h-[320px] cursor-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Blob */}
            <div className={`absolute inset-0 ${colorClass} rounded-3xl blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

            {/* Card Content */}
            <div
                ref={cardRef}
                className="relative h-full w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 flex flex-col items-center text-center transition-transform duration-100 ease-out will-change-transform shadow-xl"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div ref={glowRef} className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 mix-blend-soft-light z-20 rounded-3xl" />

                <div className="relative z-10 flex-1 flex flex-col items-center">
                    <div className={`mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 ${glowColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-indigo-200 transition-colors">{title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm lg:text-base font-light">{description}</p>
                </div>
            </div>
        </div>
    );
};

const Section = ({ id, onVisible, children, className = "" }) => {
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onVisible(id);
                }
            },
            { threshold: 0.4 } // Slightly earlier trigger
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [id, onVisible]);

    return (
        <section
            id={id}
            ref={ref}
            className={`h-screen w-full snap-start flex flex-col items-center justify-center relative p-6 lg:p-20 overflow-hidden ${className}`}
        >
            {children}
        </section>
    );
};

const AnimatedHeader = ({ text, subtitle, trigger }) => {
    return (
        <div className={`text-center mb-16 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${trigger ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-12 opacity-0 blur-xl'}`}>
            <h2 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight text-white drop-shadow-2xl">
                {text}
            </h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                {subtitle}
            </p>
        </div>
    );
};

export default function Welcome() {
    // Reduced Section List
    const [activeSection, setActiveSection] = useState('hero');
    const sections = ['hero', 'intelligence', 'operations', 'resilience', 'final'];

    return (
        <div className="fixed inset-0 z-[100] bg-[#020010] text-white font-sans selection:bg-indigo-500/50 h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar cursor-none">
            <Head title="Welcome to VenQore" />
            <NebulaBackground />
            <CustomCursor />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full p-8 z-50 flex justify-center pointer-events-none">
                <div className="flex items-center gap-3 px-6 py-3 rounded-full pointer-events-auto">
                    {/* Replaced text logo with Image */}
                    <img
                        src="/images/logo.png"
                        alt="VenQore Logo"
                        className="h-12 w-auto object-contain drop-shadow-2xl"
                    />

                    {/* Fallback in case image doesn't load */}
                    <span className="hidden text-xl font-black tracking-tight drop-shadow-2xl">VenQore<span className="text-indigo-400">.</span></span>
                </div>
            </nav>

            {/* Progress Dots */}
            <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 pointer-events-none mix-blend-screen hidden lg:flex">
                {sections.map((sec) => (
                    <div
                        key={sec}
                        className={`transition-all duration-500 rounded-full ${activeSection === sec ? 'w-1.5 h-12 bg-indigo-400 shadow-[0_0_15px_#818cf8]' : 'w-1.5 h-1.5 bg-white/10'}`}
                    />
                ))}
            </div>

            {/* 1. HERO */}
            <Section id="hero" onVisible={setActiveSection}>
                <div className="text-center max-w-5xl z-10">
                    <div className={`transition-all duration-1000 transform ease-[cubic-bezier(0.22,1,0.36,1)] ${activeSection === 'hero' ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-10 opacity-0 blur-sm'}`}>
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 text-sm font-semibold tracking-widest uppercase mb-10 animate-pulse-slow backdrop-blur-md">
                            <Sparkles size={14} />
                            <span>Access Granted</span>
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.85] drop-shadow-2xl overflow-hidden">
                            <div className="flex flex-col">
                                <span className="relative inline-block overflow-hidden">
                                     <span className="block animate-character-rise bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                        WELCOME
                                     </span>
                                     <span className="absolute inset-0 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent opacity-20 blur-sm animate-glitch-fast">WELCOME</span>
                                </span>
                                <span className="relative inline-block overflow-hidden">
                                     <span className="block animate-character-rise-delay bg-gradient-to-r from-indigo-300 via-indigo-500 to-indigo-300 bg-clip-text text-transparent text-glow">
                                        TO VENQORE.
                                     </span>
                                     <span className="absolute inset-0 bg-gradient-to-r from-indigo-300 via-indigo-500 to-indigo-300 bg-clip-text text-transparent opacity-20 blur-sm animate-glitch-slow">TO VENQORE.</span>
                                </span>
                            </div>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-16 font-light animate-fade-in-delayed">
                            The engine is primed. The data is live. <br />
                            You have officially entered the <span className="text-white font-medium text-glow-indigo">Growth Frequency</span>.
                        </p>
                        
                        <div className="flex flex-col items-center gap-4 opacity-50 animate-bounce-slow">
                            <MousePointer2 className="text-indigo-400" />
                            <span className="text-xs uppercase tracking-[0.4em] text-indigo-400/70 font-bold">Scroll to Begin</span>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes character-rise {
                        0% { transform: translateY(110%); opacity: 0; filter: blur(10px); }
                        100% { transform: translateY(0); opacity: 1; filter: blur(0); }
                    }
                    .animate-character-rise { 
                        animation: character-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
                    .animate-character-rise-delay { 
                        animation: character-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
                        transform: translateY(110%);
                    }
                    
                    @keyframes glitch-fast {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(-2px, 2px); }
                        40% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                    }
                    .animate-glitch-fast { animation: glitch-fast 0.2s linear infinite; opacity: 0; }
                    .animate-glitch-fast:hover { opacity: 0.3; }
                    
                    @keyframes glitch-slow {
                        0%, 100% { transform: translate(0); }
                        10% { transform: translate(-1px, 1px); }
                        20% { transform: translate(1px, -1px); }
                    }
                    .animate-glitch-slow { animation: glitch-slow 3s linear infinite; }
                    
                    .animate-fade-in-delayed {
                        animation: fade-in 1s ease-out 1s forwards;
                        opacity: 0;
                    }
                    @keyframes fade-in {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .animate-bounce-slow {
                        animation: bounce-slow 2s ease-in-out infinite;
                    }
                    @keyframes bounce-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    
                    .text-glow-indigo { text-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
                `}</style>
            </Section>

            {/* 2. THE INTELLIGENCE SUITE (AI + GROWTH + ANALYTICS) */}
            <Section id="intelligence" onVisible={setActiveSection}>
                <div className="max-w-7xl w-full mx-auto z-10">
                    <AnimatedHeader
                        text="INTELLIGENCE SUITE"
                        subtitle="Harness artificial intelligence to predict trends, optimize pricing, and visualize your future."
                        trigger={activeSection === 'intelligence'}
                    />

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-300 ease-out ${activeSection === 'intelligence' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                        <FeatureCard
                            icon={Brain}
                            title="AI Insights"
                            description="Predictive algorithms that decode market trends before they happen."
                            colorClass="bg-violet-600"
                            glowColor="text-violet-400 shadow-violet-500/20"
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Growth Engine"
                            description="Automated marketing and retention tools working 24/7."
                            colorClass="bg-emerald-600"
                            glowColor="text-emerald-400 shadow-emerald-500/20"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Vision Analytics"
                            description="38+ comprehensive reports giving you X-ray vision into your business."
                            colorClass="bg-pink-600"
                            glowColor="text-pink-400 shadow-pink-500/20"
                        />
                    </div>
                </div>
            </Section>

            {/* 3. OPERATIONS HUB (POS + INVENTORY + MULTI) */}
            <Section id="operations" onVisible={setActiveSection}>
                <div className="max-w-7xl w-full mx-auto z-10">
                    <AnimatedHeader
                        text="OPERATIONS HUB"
                        subtitle="Speed, scale, and control. Manage everything from a single command center."
                        trigger={activeSection === 'operations'}
                    />

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-300 ease-out ${activeSection === 'operations' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                        <FeatureCard
                            icon={Zap}
                            title="Lightning POS"
                            description="Process sales in milliseconds. Designed for pure speed."
                            colorClass="bg-amber-600"
                            glowColor="text-amber-400 shadow-amber-500/20"
                        />
                        <FeatureCard
                            icon={Package}
                            title="Smart Inventory"
                            description="Real-time stock tracking with low-stock alerts across warehouses."
                            colorClass="bg-cyan-600"
                            glowColor="text-cyan-400 shadow-cyan-500/20"
                        />
                        <FeatureCard
                            icon={Layers}
                            title="Multi-Branch"
                            description="Scale without limits. Manage infinite locations from one dashboard."
                            colorClass="bg-indigo-600"
                            glowColor="text-indigo-400 shadow-indigo-500/20"
                        />
                    </div>
                </div>
            </Section>

            {/* 4. RESILIENCE LAYER (CUSTOMERS + OFFLINE) */}
            <Section id="resilience" onVisible={setActiveSection}>
                <div className="max-w-5xl w-full mx-auto z-10">
                    <AnimatedHeader
                        text="RESILIENCE LAYER"
                        subtitle="Unbreakable connection. Your business never stops, and neither do we."
                        trigger={activeSection === 'resilience'}
                    />

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 transition-all duration-1000 delay-300 ease-out ${activeSection === 'resilience' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                        <FeatureCard
                            icon={Users}
                            title="Customer Intel"
                            description="Know your customers better than they know themselves. Build loyalty that lasts."
                            colorClass="bg-fuchsia-600"
                            glowColor="text-fuchsia-400 shadow-fuchsia-500/20"
                        />
                        <FeatureCard
                            icon={WifiOff}
                            title="Offline Mode"
                            description="Internet down? No problem. Full functionality continues seamlessly."
                            colorClass="bg-slate-600"
                            glowColor="text-slate-400 shadow-slate-500/20"
                        />
                    </div>
                </div>
            </Section>

            {/* 5. FINAL LAUNCHPAD */}
            <Section id="final" onVisible={setActiveSection} className="text-center">
                <div className={`max-w-4xl mx-auto flex flex-col items-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${activeSection === 'final' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(139,92,246,0.3)] animate-pulse border border-white/10">
                        <Sparkles size={48} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    </div>
                    <AnimatedHeader
                        text="ENDLESS POSSIBILITIES."
                        subtitle="Manufacturing, invoicing, expenses, proposals, and AI-driven automation—all in one platform."
                        trigger={activeSection === 'final'}
                    />

                    {/* CTA BUTTON */}
                    <Link
                        href={safeRoute('login')}
                        className="group relative inline-flex items-center gap-4 px-12 py-6 bg-white text-black hover:bg-indigo-50 rounded-full font-bold text-xl md:text-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.6)] mt-8"
                    >
                        <span>Start Your Journey</span>
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                            <ArrowRight size={20} />
                        </div>
                    </Link>

                    <p className="mt-16 text-slate-600 text-sm tracking-wide">
                        © {new Date().getFullYear()} VenQore Point of Sale. Built for the ambitious.
                    </p>
                </div>
            </Section>
        </div>
    );
}
