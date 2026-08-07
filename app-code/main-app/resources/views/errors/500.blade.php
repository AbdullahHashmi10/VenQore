<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>500 - Server Error | VenQore</title>
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body class="bg-slate-950 font-sans antialiased h-screen w-screen overflow-hidden flex flex-col items-center justify-center relative selection:bg-red-500 selection:text-white">

    <!-- Background Effects -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <!-- Blob 1 -->
        <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[128px]"></div>
        <!-- Blob 2 -->
        <div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[128px]"></div>
        <!-- Center Glow -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)]"></div>
        <!-- Grid Pattern (Optional) -->
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 text-center px-4 max-w-lg mx-auto">
        <!-- Glitchy 500 -->
        <div class="relative">
            <h1 class="text-[120px] md:text-[180px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-500 tracking-tighter drop-shadow-2xl select-none">
                500
            </h1>
            <div class="absolute inset-0 text-[120px] md:text-[180px] font-black leading-none text-red-500/10 blur-xl tracking-tighter select-none -z-10">500</div>
        </div>
        
        <p class="mt-2 text-2xl md:text-3xl font-bold text-slate-200">System Malfunction</p>
        <p class="mt-4 text-slate-400 text-lg">
            Our systems encountered an unexpected error. 
            We've been notified and are working on a fix.
        </p>

        <!-- Action Button -->
        <div class="mt-10">
            <a href="/" class="group relative inline-flex items-center justify-center px-8 py-3.5 font-bold text-white transition-all duration-200 bg-red-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 ring-offset-slate-900 hover:bg-red-700 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20 overflow-hidden">
                <span class="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                <span class="relative flex items-center gap-3">
                    <!-- Refresh Icon SVG -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:rotate-180">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                        <path d="M16 21h5v-5"/>
                    </svg>
                    Reload System
                </span>
            </a>
        </div>
        
    </div>

    <!-- Footer -->
    <div class="absolute bottom-8 text-center w-full z-10 pointer-events-none">
        <p class="text-[10px] text-slate-600 font-mono uppercase tracking-widest">System Status: Critical • Error Code: 500_INTERNAL_SERVER_ERROR</p>
    </div>

</body>
</html>
