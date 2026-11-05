import { initials } from '../lib/format';

export default function Avatar({ name, url, size = 48 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="avatar" src={url} alt="" width={size} height={size} style={style} loading="lazy" referrerPolicy="no-referrer" />
    );
  }
  return (
    <span className="avatar avatar-initials" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
