import fs from 'fs';
import path from 'path';
import Link from 'next/link';

function listDir(sub: string) {
  const dir = path.join(process.cwd(), 'public', sub);
  try {
    return fs.readdirSync(dir);
  } catch {
    return [] as string[];
  }
}

export default function DebugAssetsPage() {
  const images = listDir('images');
  const logo = listDir('logo');

  return (
    <div style={{ padding: 24 }}>
      <h1>Debug Assets</h1>
      <p>Lists files under public/ and links to them to verify serving.</p>
      <h2>/public/logo</h2>
      <ul>
        {logo.map((f) => (
          <li key={f}>
            <Link href={`/logo/${encodeURIComponent(f)}`}>{`/logo/${f}`}</Link>
          </li>
        ))}
      </ul>
      <h2>/public/images</h2>
      <ul>
        {images.slice(0, 50).map((f) => (
          <li key={f}>
            <Link href={`/images/${encodeURIComponent(f)}`}>{`/images/${f}`}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

