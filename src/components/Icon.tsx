import type { CSSProperties } from 'react';
import {
  AlertCircle, ArrowDownToLine, ArrowRight, ArrowUp, Award, BarChart3, Bell, BellOff, BookOpen, Brain, Briefcase, Bug, Building2,
  Calendar, CalendarPlus, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Cloud, Code2, Coins, Compass, Copy,
  Database, Download, ExternalLink, Factory, FileText, Flag, FlaskConical, Handshake, Headphones, Heart, History, Home, Info, Lightbulb,
  Link, ListChecks, Megaphone, MessageCircle, Mic, MicOff, Monitor, Moon, Palette, Pencil, PenTool, Play, Plus, Quote, RotateCcw, Server,
  Settings, Share2, Shield, ShoppingBag, SlidersHorizontal, Smartphone, Sparkles, Star, Sun, Target, Trash2, Truck, User, Users, Video,
  Wand2, WifiOff, X,
  type LucideIcon,
} from 'lucide-react';
import type { JobIcon } from '../data/jobs';

// 아이콘은 Lucide(MIT) 한 세트만 씁니다. 이름은 화면 코드가 쓰는 짧은 이름이고, 여기서만 실제 아이콘으로 바꿉니다.
export type IconName =
  | JobIcon
  | 'home' | 'compass' | 'user' | 'doc' | 'mic' | 'mic-off'
  | 'check' | 'check-circle' | 'circle' | 'download' | 'heart' | 'bulb' | 'sparkle' | 'copy' | 'install' | 'arrow' | 'arrow-up' | 'refresh'
  | 'plus' | 'trash' | 'edit' | 'calendar' | 'calendar-plus' | 'bell' | 'bell-off' | 'link' | 'clock' | 'chevron' | 'chevron-down' | 'back' | 'x'
  | 'share' | 'settings' | 'award' | 'list' | 'message' | 'briefcase' | 'building' | 'moon' | 'sun' | 'monitor' | 'wifi-off' | 'alert' | 'info'
  | 'external' | 'filter' | 'quote' | 'history' | 'wand' | 'star';

const ICONS: Record<IconName, LucideIcon> = {
  chart: BarChart3, play: Play, phone: Smartphone, data: Database, design: PenTool, brand: Star, people: Users, code: Code2, server: Server,
  handshake: Handshake, megaphone: Megaphone, bag: ShoppingBag, brain: Brain, bug: Bug, cloud: Cloud, shield: Shield, palette: Palette,
  video: Video, coin: Coins, target: Target, headset: Headphones, book: BookOpen, flask: FlaskConical, factory: Factory, truck: Truck, flag: Flag,
  home: Home, compass: Compass, user: User, doc: FileText, mic: Mic, 'mic-off': MicOff,
  check: Check, 'check-circle': CheckCircle2, circle: Circle, download: Download, heart: Heart, bulb: Lightbulb, sparkle: Sparkles, copy: Copy,
  install: ArrowDownToLine, arrow: ArrowRight, 'arrow-up': ArrowUp, refresh: RotateCcw,
  plus: Plus, trash: Trash2, edit: Pencil, calendar: Calendar, 'calendar-plus': CalendarPlus, bell: Bell, 'bell-off': BellOff, link: Link,
  clock: Clock, chevron: ChevronRight, 'chevron-down': ChevronDown, back: ChevronLeft, x: X,
  share: Share2, settings: Settings, award: Award, list: ListChecks, message: MessageCircle, briefcase: Briefcase, building: Building2,
  moon: Moon, sun: Sun, monitor: Monitor, 'wifi-off': WifiOff, alert: AlertCircle, info: Info, external: ExternalLink, filter: SlidersHorizontal,
  quote: Quote, history: History, wand: Wand2, star: Star,
};

export function Icon({
  name,
  size = 20,
  className,
  style,
  strokeWidth = 2,
  fill,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
  fill?: string;
}) {
  const Component = ICONS[name];
  return <Component size={size} className={className} style={style} strokeWidth={strokeWidth} fill={fill ?? 'none'} aria-hidden="true" />;
}
