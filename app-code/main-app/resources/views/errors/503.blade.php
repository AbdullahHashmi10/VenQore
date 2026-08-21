<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VenQore — System Optimization in Progress</title>
    {{-- Local faces. This page renders mid-deploy, when the built asset
         manifest may not exist and the network may not either. --}}
    <link href="/css/offline-fonts.css" rel="stylesheet">
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --panel-bg: rgba(30, 41, 59, 0.7);
            --primary: #6366f1;
            --primary-glow: rgba(99, 102, 241, 0.15);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        body {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg-gradient);
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--text-main);
            overflow: hidden;
        }

        /* Subtle glowing background circles */
        .glow-circle {
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: var(--primary);
            filter: blur(150px);
            opacity: 0.12;
            z-index: 0;
            pointer-events: none;
        }
        .glow-1 { top: -10%; left: -10%; }
        .glow-2 { bottom: -10%; right: -10%; }

        .container {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 3rem 2rem;
            max-width: 520px;
            background: var(--panel-bg);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            backdrop-filter: blur(16px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 50px var(--primary-glow);
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .icon-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.25);
            border-radius: 20px;
            margin-bottom: 2rem;
            animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }

        .icon-container svg {
            width: 40px;
            height: 40px;
            stroke: var(--primary);
        }

        h1 {
            font-family: 'Bricolage Grotesque', sans-serif;
            font-size: 2.25rem;
            font-weight: 800;
            margin: 0 0 1rem 0;
            letter-spacing: -0.025em;
            background: linear-gradient(to right, #ffffff, #c7d2fe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p.status {
            font-size: 1.125rem;
            font-weight: 600;
            color: #a5b4fc;
            margin: 0 0 1rem 0;
        }

        p.description {
            font-size: 1rem;
            line-height: 1.6;
            color: var(--text-muted);
            margin: 0 0 2rem 0;
        }

        .spinner {
            display: inline-block;
            width: 2.5rem;
            height: 2.5rem;
            border: 3px solid rgba(99, 102, 241, 0.2);
            border-radius: 50%;
            border-top-color: var(--primary);
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .wait-text {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-muted);
            margin-top: 0.75rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="glow-circle glow-1"></div>
    <div class="glow-circle glow-2"></div>

    <div class="container">
        <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        </div>
        
        <h1>Making Things Even Better</h1>
        <p class="status">System Optimization in Progress</p>
        <p class="description">
            {{ $message ?? "We are currently updating our systems to bring you new features and make your experience faster and more robust. Don't worry—your transaction was not posted, so your data remains perfectly safe. Please wait a moment while the update completes." }}
        </p>
        
        <div class="spinner"></div>
        <div class="wait-text">Please wait...</div>
    </div>
</body>
</html>
