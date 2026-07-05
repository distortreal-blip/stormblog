import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articleDir = path.join(__dirname, '../src/content/blog/razvernut-sayt-na-vps-2026');
const coverOutput = path.join(articleDir, 'cover.webp');

fs.mkdirSync(articleDir, { recursive: true });

const coverCandidates = [
	path.join(__dirname, '../public/og-default.jpg'),
	path.join(
		'C:/Users/User/.cursor/projects/C-Users-User-AppData-Local-Temp-49f4b55d-bba7-49f1-9b6c-376ecf4575a5/assets/cover-source.png',
	),
];

const coverSource = coverCandidates.find((candidate) => fs.existsSync(candidate));

if (coverSource) {
	await sharp(coverSource).resize(1200, 630, { fit: 'cover' }).webp({ quality: 88 }).toFile(coverOutput);
	console.log('cover.webp');
} else if (fs.existsSync(coverOutput)) {
	console.log('cover.webp (existing)');
}

const diagrams = {
	'diagram-architecture.webp': `<svg width="1200" height="680" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="680"><stop offset="0%" stop-color="#050505"/><stop offset="100%" stop-color="#0f172a"/></linearGradient>
    <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#6366f1"/></linearGradient>
  </defs>
  <rect width="1200" height="680" fill="url(#bg)"/>
  <text x="600" y="48" text-anchor="middle" fill="#fafafa" font-family="Arial,sans-serif" font-size="28" font-weight="700">Архитектура сайта на VPS</text>
  <rect x="80" y="110" width="1040" height="90" rx="16" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
  <text x="600" y="165" text-anchor="middle" fill="#38bdf8" font-family="Arial,sans-serif" font-size="22" font-weight="600">Пользователь → DNS → Домен → HTTPS</text>
  <path d="M600 200 V240" stroke="#64748b" stroke-width="2"/>
  <polygon points="600,240 590,225 610,225" fill="#64748b"/>
  <rect x="180" y="250" width="840" height="110" rx="16" fill="#111827" stroke="#22d3ee" stroke-width="2"/>
  <text x="600" y="295" text-anchor="middle" fill="#22d3ee" font-family="Arial,sans-serif" font-size="20" font-weight="600">Nginx (reverse proxy + SSL)</text>
  <text x="600" y="330" text-anchor="middle" fill="#94a3b8" font-family="Arial,sans-serif" font-size="16">Порт 443 · Let&apos;s Encrypt · gzip · rate limit</text>
  <path d="M600 360 V400" stroke="#64748b" stroke-width="2"/>
  <polygon points="600,400 590,385 610,385" fill="#64748b"/>
  <rect x="120" y="410" width="360" height="120" rx="16" fill="#111827" stroke="#a78bfa" stroke-width="2"/>
  <text x="300" y="460" text-anchor="middle" fill="#a78bfa" font-family="Arial,sans-serif" font-size="20" font-weight="600">Статика</text>
  <text x="300" y="495" text-anchor="middle" fill="#94a3b8" font-family="Arial,sans-serif" font-size="15">HTML · CSS · JS · /var/www</text>
  <rect x="720" y="410" width="360" height="120" rx="16" fill="#111827" stroke="#34d399" stroke-width="2"/>
  <text x="900" y="460" text-anchor="middle" fill="#34d399" font-family="Arial,sans-serif" font-size="20" font-weight="600">Backend / API</text>
  <text x="900" y="495" text-anchor="middle" fill="#94a3b8" font-family="Arial,sans-serif" font-size="15">Node · Python · Docker</text>
  <rect x="420" y="560" width="360" height="90" rx="16" fill="#111827" stroke="#fbbf24" stroke-width="2"/>
  <text x="600" y="600" text-anchor="middle" fill="#fbbf24" font-family="Arial,sans-serif" font-size="20" font-weight="600">PostgreSQL / Redis</text>
  <text x="600" y="630" text-anchor="middle" fill="#94a3b8" font-family="Arial,sans-serif" font-size="15">Данные · кэш · сессии</text>
</svg>`,
	'diagram-deploy-flow.webp': `<svg width="1200" height="620" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="620" fill="#050505"/>
  <text x="600" y="44" text-anchor="middle" fill="#fafafa" font-family="Arial,sans-serif" font-size="28" font-weight="700">Путь деплоя: от VPS до production</text>
  <g font-family="Arial,sans-serif">
    <rect x="60" y="100" width="190" height="88" rx="14" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
    <text x="155" y="140" text-anchor="middle" fill="#38bdf8" font-size="17" font-weight="600">1. VPS</text>
    <text x="155" y="168" text-anchor="middle" fill="#94a3b8" font-size="14">Ubuntu 22.04</text>
    <text x="280" y="148" fill="#64748b" font-size="28">→</text>
    <rect x="310" y="100" width="190" height="88" rx="14" fill="#111827" stroke="#22d3ee" stroke-width="2"/>
    <text x="405" y="140" text-anchor="middle" fill="#22d3ee" font-size="17" font-weight="600">2. SSH</text>
    <text x="405" y="168" text-anchor="middle" fill="#94a3b8" font-size="14">Ключи · UFW</text>
    <text x="530" y="148" fill="#64748b" font-size="28">→</text>
    <rect x="560" y="100" width="190" height="88" rx="14" fill="#111827" stroke="#a78bfa" stroke-width="2"/>
    <text x="655" y="140" text-anchor="middle" fill="#a78bfa" font-size="17" font-weight="600">3. Nginx</text>
    <text x="655" y="168" text-anchor="middle" fill="#94a3b8" font-size="14">vhost · SSL</text>
    <text x="780" y="148" fill="#64748b" font-size="28">→</text>
    <rect x="810" y="100" width="190" height="88" rx="14" fill="#111827" stroke="#34d399" stroke-width="2"/>
    <text x="905" y="140" text-anchor="middle" fill="#34d399" font-size="17" font-weight="600">4. Deploy</text>
    <text x="905" y="168" text-anchor="middle" fill="#94a3b8" font-size="14">Git · Docker</text>
    <text x="1030" y="148" fill="#64748b" font-size="28">→</text>
    <rect x="950" y="100" width="190" height="88" rx="14" fill="#111827" stroke="#fbbf24" stroke-width="2"/>
    <text x="1045" y="140" text-anchor="middle" fill="#fbbf24" font-size="17" font-weight="600">5. Live</text>
    <text x="1045" y="168" text-anchor="middle" fill="#94a3b8" font-size="14">Мониторинг</text>
  </g>
  <rect x="100" y="260" width="1000" height="300" rx="20" fill="#0a0a0a" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="140" y="310" fill="#94a3b8" font-family="monospace" font-size="16">$ ssh deploy@your-vps</text>
  <text x="140" y="345" fill="#94a3b8" font-family="monospace" font-size="16">$ sudo apt update &amp;&amp; sudo apt install nginx certbot -y</text>
  <text x="140" y="380" fill="#94a3b8" font-family="monospace" font-size="16">$ sudo certbot --nginx -d example.com</text>
  <text x="140" y="415" fill="#94a3b8" font-family="monospace" font-size="16">$ git clone https://github.com/you/project.git /var/www/app</text>
  <text x="140" y="450" fill="#34d399" font-family="monospace" font-size="16">✓ https://example.com — сайт в production</text>
</svg>`,
	'diagram-security-layers.webp': `<svg width="1200" height="640" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="640" fill="#050505"/>
  <text x="600" y="44" text-anchor="middle" fill="#fafafa" font-family="Arial,sans-serif" font-size="28" font-weight="700">Слои безопасности VPS</text>
  <ellipse cx="600" cy="340" rx="420" ry="240" fill="none" stroke="#ef4444" stroke-width="3" opacity="0.35"/>
  <text x="600" y="130" text-anchor="middle" fill="#ef4444" font-family="Arial,sans-serif" font-size="18" font-weight="600">Firewall UFW · fail2ban · SSH keys</text>
  <ellipse cx="600" cy="340" rx="320" ry="180" fill="none" stroke="#f59e0b" stroke-width="3" opacity="0.4"/>
  <text x="600" y="195" text-anchor="middle" fill="#f59e0b" font-family="Arial,sans-serif" font-size="18" font-weight="600">HTTPS · автообновление · non-root user</text>
  <ellipse cx="600" cy="340" rx="220" ry="120" fill="none" stroke="#38bdf8" stroke-width="3" opacity="0.5"/>
  <text x="600" y="265" text-anchor="middle" fill="#38bdf8" font-family="Arial,sans-serif" font-size="18" font-weight="600">Nginx rate limit · headers · WAF rules</text>
  <ellipse cx="600" cy="340" rx="120" ry="60" fill="#111827" stroke="#34d399" stroke-width="3"/>
  <text x="600" y="335" text-anchor="middle" fill="#34d399" font-family="Arial,sans-serif" font-size="20" font-weight="700">Приложение</text>
  <text x="600" y="360" text-anchor="middle" fill="#94a3b8" font-family="Arial,sans-serif" font-size="14">ваши данные</text>
  <text x="600" y="590" text-anchor="middle" fill="#71717a" font-family="Arial,sans-serif" font-size="15">Чем ближе к центру — тем важнее защищать каждый слой</text>
</svg>`,
};

for (const [filename, svg] of Object.entries(diagrams)) {
	await sharp(Buffer.from(svg)).webp({ quality: 92 }).toFile(path.join(articleDir, filename));
	console.log(filename);
}
