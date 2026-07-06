import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.join(__dirname, '../src/content/blog');

const covers = {
	'kubernetes-minikube-vps': {
		style: 'isometric',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0c0a14"/>
      <polygon points="600,120 780,220 780,420 600,520 420,420 420,220" fill="#1e1b4b" stroke="#818cf8" stroke-width="3"/>
      <polygon points="600,180 700,240 700,380 600,440 500,380 500,240" fill="#312e81" stroke="#a5b4fc" stroke-width="2"/>
      <circle cx="600" cy="310" r="48" fill="#4f46e5"/>
      <text x="600" y="318" text-anchor="middle" fill="white" font-family="Arial" font-size="22" font-weight="700">K8s</text>
      <text x="600" y="580" text-anchor="middle" fill="#c4b5fd" font-family="Arial" font-size="32" font-weight="700">Kubernetes на VPS</text>
    </svg>`,
	},
	'ansible-avtomatizaciya-servera': {
		style: 'flat-minimal',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#fafafa"/>
      <rect x="0" y="0" width="1200" height="180" fill="#ee0000"/>
      <text x="80" y="120" fill="white" font-family="Arial" font-size="72" font-weight="700">Ansible</text>
      <text x="80" y="320" fill="#111" font-family="Arial" font-size="42" font-weight="600">Автоматизация</text>
      <text x="80" y="380" fill="#555" font-family="Arial" font-size="42">серверов</text>
      <circle cx="980" cy="450" r="120" fill="#ee0000" opacity="0.15"/>
      <circle cx="980" cy="450" r="80" fill="#ee0000" opacity="0.25"/>
    </svg>`,
	},
	'nginx-logi-i-oshibki': {
		style: 'terminal',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0d1117"/>
      <rect x="60" y="60" width="1080" height="510" rx="12" fill="#161b22" stroke="#30363d"/>
      <circle cx="95" cy="95" r="8" fill="#ff5f57"/><circle cx="125" cy="95" r="8" fill="#febc2e"/><circle cx="155" cy="95" r="8" fill="#28c840"/>
      <text x="100" y="180" fill="#7ee787" font-family="monospace" font-size="22">$ tail -f /var/log/nginx/error.log</text>
      <text x="100" y="230" fill="#ffa657" font-family="monospace" font-size="20">2026/07/07 [error] upstream timed out</text>
      <text x="100" y="280" fill="#79c0ff" font-family="monospace" font-size="20">GET /api/users 502 0.891</text>
      <text x="100" y="330" fill="#7ee787" font-family="monospace" font-size="20">$ grep "404" access.log | wc -l</text>
      <text x="100" y="380" fill="#f0f6fc" font-family="monospace" font-size="20">1247</text>
      <text x="100" y="500" fill="#8b949e" font-family="Arial" font-size="28">Логи Nginx</text>
    </svg>`,
	},
	'docker-multi-stage-builds': {
		style: 'geometric-layers',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0db7ed"/><stop offset="100%" stop-color="#066aab"/></linearGradient></defs>
      <rect width="1200" height="630" fill="#051923"/>
      <rect x="200" y="380" width="800" height="80" rx="8" fill="url(#g)" opacity="0.3"/>
      <rect x="250" y="300" width="700" height="80" rx="8" fill="url(#g)" opacity="0.5"/>
      <rect x="300" y="220" width="600" height="80" rx="8" fill="url(#g)" opacity="0.7"/>
      <rect x="350" y="140" width="500" height="80" rx="8" fill="url(#g)"/>
      <text x="600" y="560" text-anchor="middle" fill="#7dd3fc" font-family="Arial" font-size="36" font-weight="700">Multi-stage Build</text>
    </svg>`,
	},
	'zashchita-vps-ot-vzloma': {
		style: 'shield-dark',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#1a0505"/>
      <path d="M600 100 L820 200 V380 C820 480 600 560 600 560 C600 560 380 480 380 380 V200 Z" fill="none" stroke="#ef4444" stroke-width="6"/>
      <path d="M600 150 L760 230 V370 C760 440 600 500 600 500 C600 500 440 440 440 370 V230 Z" fill="#7f1d1d" stroke="#fca5a5" stroke-width="3"/>
      <text x="600" y="340" text-anchor="middle" fill="#fecaca" font-family="Arial" font-size="48" font-weight="700">SECURE</text>
      <text x="600" y="590" text-anchor="middle" fill="#f87171" font-family="Arial" font-size="30">Защита VPS</text>
    </svg>`,
	},
	'cloudflare-i-vps': {
		style: 'cloud-gradient',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f97316"/><stop offset="50%" stop-color="#fb923c"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient></defs>
      <rect width="1200" height="630" fill="url(#sky)"/>
      <ellipse cx="400" cy="280" rx="180" ry="70" fill="white" opacity="0.9"/>
      <ellipse cx="520" cy="260" rx="140" ry="55" fill="white" opacity="0.85"/>
      <ellipse cx="750" cy="300" rx="200" ry="75" fill="white" opacity="0.8"/>
      <rect x="450" y="420" width="300" height="120" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="600" y="495" text-anchor="middle" fill="#38bdf8" font-family="Arial" font-size="28" font-weight="700">VPS</text>
      <text x="600" y="580" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="600">Cloudflare + VPS</text>
    </svg>`,
	},
	'fastapi-deploy-vps': {
		style: 'neon-dev',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0f0520"/>
      <text x="600" y="280" text-anchor="middle" fill="#a855f7" font-family="Arial" font-size="120" font-weight="700" filter="url(#glow)">FastAPI</text>
      <defs><filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <text x="600" y="400" text-anchor="middle" fill="#22d3ee" font-family="monospace" font-size="28">uvicorn main:app --host 0.0.0.0</text>
      <rect x="350" y="450" width="500" height="4" fill="#ec4899"/>
      <text x="600" y="560" text-anchor="middle" fill="#e9d5ff" font-family="Arial" font-size="30">Deploy на VPS</text>
    </svg>`,
	},
	'backup-vps-3-2-1': {
		style: 'archive-blue',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0c1929"/>
      <rect x="420" y="140" width="360" height="320" rx="16" fill="#1e40af" stroke="#60a5fa" stroke-width="4"/>
      <rect x="460" y="180" width="280" height="40" rx="6" fill="#3b82f6"/>
      <text x="600" y="300" text-anchor="middle" fill="#bfdbfe" font-family="Arial" font-size="64" font-weight="700">3-2-1</text>
      <text x="600" y="360" text-anchor="middle" fill="#93c5fd" font-family="Arial" font-size="24">BACKUP</text>
      <circle cx="300" cy="480" r="40" fill="#1d4ed8" opacity="0.5"/>
      <circle cx="900" cy="480" r="40" fill="#1d4ed8" opacity="0.5"/>
      <text x="600" y="560" text-anchor="middle" fill="#dbeafe" font-family="Arial" font-size="28">Стратегия бэкапов</text>
    </svg>`,
	},
	'systemd-linux-servisy': {
		style: 'blueprint',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0a1628"/>
      <g stroke="#22d3ee" stroke-width="1" opacity="0.2">
        <line x1="0" y1="80" x2="1200" y2="80"/><line x1="0" y1="160" x2="1200" y2="160"/>
        <line x1="80" y1="0" x2="80" y2="630"/><line x1="160" y1="0" x2="160" y2="630"/>
      </g>
      <rect x="200" y="180" width="800" height="280" fill="none" stroke="#22d3ee" stroke-width="2" stroke-dasharray="8 4"/>
      <text x="600" y="280" text-anchor="middle" fill="#67e8f9" font-family="monospace" font-size="36">[Unit]</text>
      <text x="600" y="330" text-anchor="middle" fill="#a5f3fc" font-family="monospace" font-size="28">Description=My App</text>
      <text x="600" y="380" text-anchor="middle" fill="#67e8f9" font-family="monospace" font-size="36">[Service]</text>
      <text x="600" y="560" text-anchor="middle" fill="#22d3ee" font-family="Arial" font-size="34" font-weight="600">Systemd Services</text>
    </svg>`,
	},
	'postgresql-tuning-vps': {
		style: 'synthwave',
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs><linearGradient id="sun" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ff00ff"/><stop offset="50%" stop-color="#7928ca"/><stop offset="100%" stop-color="#ff8a00"/></linearGradient></defs>
      <rect width="1200" height="630" fill="#1a0a2e"/>
      <rect x="0" y="400" width="1200" height="230" fill="url(#sun)" opacity="0.6"/>
      <polygon points="600,200 200,450 1000,450" fill="none" stroke="#00fff0" stroke-width="3"/>
      <ellipse cx="600" cy="320" rx="120" ry="50" fill="#2d1b69" stroke="#00fff0" stroke-width="2"/>
      <text x="600" y="335" text-anchor="middle" fill="#00fff0" font-family="Arial" font-size="32" font-weight="700">PostgreSQL</text>
      <text x="600" y="580" text-anchor="middle" fill="#ff71ce" font-family="Arial" font-size="30">Тюнинг на VPS</text>
    </svg>`,
	},
};

for (const [slug, { svg }] of Object.entries(covers)) {
	const dir = path.join(blogRoot, slug);
	fs.mkdirSync(dir, { recursive: true });
	await sharp(Buffer.from(svg)).resize(1200, 630).webp({ quality: 90 }).toFile(path.join(dir, 'cover.webp'));
	console.log('cover:', slug);
}
