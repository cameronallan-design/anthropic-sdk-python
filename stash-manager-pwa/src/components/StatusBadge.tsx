import { STATUS_COLORS } from '../types';

interface Props {
  status: string;
  small?: boolean;
}

export default function StatusBadge({ status, small = false }: Props) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['Unbuilt'];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        backgroundColor: c.bg,
        borderRadius: 4,
        padding: small ? '3px 8px' : '4px 10px',
        border: `1px solid ${c.dot}44`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: c.dot,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: c.text,
          fontSize: small ? 9 : 10,
          fontWeight: 700,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
        }}
      >
        {status}
      </span>
    </span>
  );
}
