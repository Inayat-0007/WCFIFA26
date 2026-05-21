import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';
import type { Position } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
}

export function formatMatchTime(date: string | Date): string {
  return format(new Date(date), 'EEE dd MMM · HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getCountdownParts(kickoffTime: string): {
  days: number; hours: number; minutes: number; seconds: number; expired: boolean;
} {
  const totalSeconds = differenceInSeconds(new Date(kickoffTime), new Date());
  if (totalSeconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

export function formatPoints(pts: number): string {
  if (pts >= 0) return `+${pts}`;
  return String(pts);
}

export function getPositionColor(position: Position): string {
  const colors: Record<Position, string> = {
    GK: 'text-gold-400 bg-gold-400/10 border-gold-400/30',
    DEF: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    MID: 'text-green-400 bg-green-400/10 border-green-400/30',
    FWD: 'text-primary-400 bg-primary-400/10 border-primary-400/30',
  };
  return colors[position] || 'text-gray-400';
}

export function getPositionLabel(position: Position): string {
  const labels: Record<Position, string> = {
    GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward',
  };
  return labels[position] || position;
}

export function getPositionShort(position: Position): string {
  return position;
}

export function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    GOAL: '⚽',
    ASSIST: '🎯',
    YELLOW_CARD: '🟨',
    RED_CARD: '🟥',
    PENALTY_MISS: '❌',
    CLEAN_SHEET: '🧤',
    SUBSTITUTION: '🔄',
  };
  return icons[type] || '•';
}

export function getCountryFlag(countryCode: string): string {
  const flagMap: Record<string, string> = {
    'AR': '🇦🇷', 'BR': '🇧🇷', 'FR': '🇫🇷', 'DE': '🇩🇪', 'ES': '🇪🇸',
    'PT': '🇵🇹', 'NL': '🇳🇱', 'BE': '🇧🇪', 'HR': '🇭🇷', 'IT': '🇮🇹',
    'GB-ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'GB-WLS': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'US': '🇺🇸', 'MX': '🇲🇽',
    'UY': '🇺🇾', 'PA': '🇵🇦', 'CL': '🇨🇱', 'PE': '🇵🇪', 'AU': '🇦🇺',
    'JP': '🇯🇵', 'CR': '🇨🇷', 'ID': '🇮🇩', 'CH': '🇨🇭', 'CM': '🇨🇲',
    'DZ': '🇩🇿', 'NZ': '🇳🇿', 'NG': '🇳🇬', 'IQ': '🇮🇶', 'SA': '🇸🇦',
    'EC': '🇪🇨', 'SN': '🇸🇳', 'CO': '🇨🇴', 'MA': '🇲🇦', 'KR': '🇰🇷',
    'UA': '🇺🇦', 'VE': '🇻🇪', 'CU': '🇨🇺', 'DK': '🇩🇰', 'RS': '🇷🇸',
    'TN': '🇹🇳', 'BO': '🇧🇴', 'IR': '🇮🇷', 'CI': '🇨🇮', 'PY': '🇵🇾',
    'TR': '🇹🇷', 'PL': '🇵🇱', 'GH': '🇬🇭', 'HN': '🇭🇳',
  };
  return flagMap[countryCode] || '🏳';
}

export function getFlagByCountry(country: string): string {
  const countryToCode: Record<string, string> = {
    'Argentina': 'AR', 'Brazil': 'BR', 'France': 'FR', 'Germany': 'DE',
    'Spain': 'ES', 'Portugal': 'PT', 'Netherlands': 'NL', 'Belgium': 'BE',
    'Croatia': 'HR', 'Italy': 'IT', 'England': 'GB-ENG', 'Wales': 'GB-WLS',
    'United States': 'US', 'Mexico': 'MX', 'Uruguay': 'UY', 'Panama': 'PA',
    'Chile': 'CL', 'Peru': 'PE', 'Australia': 'AU', 'Japan': 'JP',
    'Costa Rica': 'CR', 'Indonesia': 'ID', 'Switzerland': 'CH', 'Cameroon': 'CM',
    'Algeria': 'DZ', 'New Zealand': 'NZ', 'Nigeria': 'NG', 'Iraq': 'IQ',
    'Saudi Arabia': 'SA', 'Ecuador': 'EC', 'Senegal': 'SN', 'Colombia': 'CO',
    'Morocco': 'MA', 'South Korea': 'KR', 'Ukraine': 'UA', 'Venezuela': 'VE',
    'Cuba': 'CU', 'Denmark': 'DK', 'Serbia': 'RS', 'Tunisia': 'TN',
    'Bolivia': 'BO', 'Iran': 'IR', 'Ivory Coast': 'CI', 'Paraguay': 'PY',
    'Turkey': 'TR', 'Poland': 'PL', 'Ghana': 'GH', 'Honduras': 'HN',
  };
  const code = countryToCode[country] || '';
  return getCountryFlag(code);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function getRankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
