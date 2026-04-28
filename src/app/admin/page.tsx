"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/sgas/AdminProvider';
import {
  Plus, Pencil, Trash2, LogOut, Calendar, MapPin,
  Video, Trophy, Mic, Briefcase, X, Save,
  ArrowLeft, Loader2, Sparkles
} from 'lucide-react';

interface SGASEvent {
  id: string;
  titleEn: string;
  titleAr: string;
  type: 'workshop' | 'seminar' | 'competition' | 'networking';
  dateEn: string;
  dateAr: string;
  time: string;
  locationEn: string;
  locationAr: string;
  descEn: string;
  descAr: string;
  status: 'past' | 'upcoming';
  highlights: string[];
}

const typeIcons: Record<string, typeof Video> = {
  workshop: Video,
  seminar: Mic,
  competition: Trophy,
  networking: Briefcase,
};

const typeColors: Record<string, string> = {
  workshop: 'bg-brand-100 text-brand-700',
  seminar: 'bg-red-brand-100 text-red-brand-700',
  competition: 'bg-amber-100 text-amber-700',
  networking: 'bg-leaf-100 text-leaf-700',
};

const emptyForm: Omit<SGASEvent, 'id'> = {
  titleEn: '', titleAr: '', type: 'workshop',
  dateEn: '', dateAr: '', time: '',
  locationEn: '', locationAr: '',
  descEn: '', descAr: '',
  status: 'past',
  highlights: [],
};

const monthsEn = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const monthsAr = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

function toArabicNums(num: number | string): string {
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return num.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
}

function buildDateEn(day: string, month: string, year: string): string {
  return `${month} ${day}, ${year}`;
}

function buildDateAr(day: string, monthIdx: number, year: string): string {
  return `${toArabicNums(day)} ${monthsAr[monthIdx]} ${toArabicNums(year)}`;
}

function parseDateFromForm(dateEn: string): { day: string; monthIdx: number; year: string } {
  const match = dateEn.match(/^(\w+)\s+(\d+),?\s*(\d+)$/);
  if (!match) return { day: '1', monthIdx: 0, year: new Date().getFullYear().toString() };
  const monthIdx = monthsEn.indexOf(match[1]);
  return { day: match[2], monthIdx: monthIdx >= 0 ? monthIdx : 0, year: match[3] };
}

export default function AdminPage() {
  const { admin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const [events, setEvents] = useState<SGASEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SGASEvent | null>(null);
  const [formData, setFormData] = useState<Omit<SGASEvent, 'id'>>(emptyForm);
  const [highlightsText, setHighlightsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Date picker state
  const [selDay, setSelDay] = useState('1');
  const [selMonth, setSelMonth] = useState('0');
  const [selYear, setSelYear] = useState(new Date().getFullYear().toString());

  // Time picker state
  const [selHour, setSelHour] = useState('6');
  const [selMinute, setSelMinute] = useState('00');
  const [selAmPm, setSelAmPm] = useState<'AM' | 'PM'>('PM');

  useEffect(() => {
    if (!adminLoading && !admin) {
      router.push('/login');
    }
  }, [admin, adminLoading, router]);

  useEffect(() => {
    if (admin) loadEvents();
  }, [admin]);

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const openAddForm = () => {
    setEditingEvent(null);
    setFormData(emptyForm);
    setHighlightsText('');
    setFormError('');
    setSelDay('1');
    setSelMonth('0');
    setSelYear(new Date().getFullYear().toString());
    setSelHour('6');
    setSelMinute('00');
    setSelAmPm('PM');
    setShowForm(true);
  };

  const openEditForm = (event: SGASEvent) => {
    setEditingEvent(event);
    setFormData({ ...event });
    setHighlightsText(event.highlights.join(', '));
    setFormError('');

    // Parse date
    const parsed = parseDateFromForm(event.dateEn);
    setSelDay(parsed.day);
    setSelMonth(parsed.monthIdx.toString());
    setSelYear(parsed.year);

    // Parse time
    const timeMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      setSelHour(timeMatch[1]);
      setSelMinute(timeMatch[2]);
      setSelAmPm(timeMatch[3].toUpperCase() as 'AM' | 'PM');
    } else {
      setSelHour('6');
      setSelMinute('00');
      setSelAmPm('PM');
    }

    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.titleEn.trim() || !formData.titleAr.trim()) {
      setFormError('Title (English and Arabic) is required');
      return;
    }
    setSaving(true);
    setFormError('');

    try {
      const eventData = {
        ...formData,
        time: `${selHour}:${selMinute} ${selAmPm}`,
        highlights: highlightsText.split(',').map(h => h.trim()).filter(Boolean),
      };

      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Failed to save');
        return;
      }

      setShowForm(false);
      loadEvents();
    } catch {
      setFormError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch {
      // silent fail
    } finally {
      setDeleting(null);
    }
  };

  // Update dateEn and dateAr when picker changes
  useEffect(() => {
    const monthIdx = parseInt(selMonth, 10);
    const dateEn = buildDateEn(selDay, monthsEn[monthIdx], selYear);
    const dateAr = buildDateAr(selDay, monthIdx, selYear);
    setFormData(prev => ({ ...prev, dateEn, dateAr }));
  }, [selDay, selMonth, selYear]);

  if (adminLoading || !admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-700 animate-spin" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(parseInt(selYear), parseInt(selMonth) + 1, 0).getDate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/sgas-logo.png" alt="SGAS" fill className="object-cover" />
              </div>
              <div>
                <span className="text-lg font-bold text-brand-700">SGAS Admin</span>
                <p className="text-xs text-gray-500">{admin.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/social"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-medium"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Social</span>
              </Link>
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
            <p className="text-sm text-gray-500 mt-1">Add, edit, or remove events ({events.length} total)</p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Add Event
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-brand-700 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No events yet</p>
            <p className="text-sm text-gray-400 mt-1">Click &quot;Add Event&quot; to create your first event</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => {
              const TypeIcon = typeIcons[event.type] || Video;
              return (
                <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeColors[event.type]}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      event.status === 'upcoming'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm mb-0.5 leading-tight">{event.titleEn}</h3>
                  <p className="text-xs text-gray-400 mb-2">{event.titleAr}</p>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {event.dateEn}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.locationEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditForm(event)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                    >
                      {deleting === event.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                  {formError}
                </div>
              )}

              {/* English Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (English) *</label>
                <input
                  value={formData.titleEn}
                  onChange={(e) => setFormData((p) => ({ ...p, titleEn: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                  placeholder="Event title in English"
                />
              </div>

              {/* Arabic Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Arabic) *</label>
                <input
                  value={formData.titleAr}
                  onChange={(e) => setFormData((p) => ({ ...p, titleAr: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                  dir="rtl"
                  placeholder="عنوان الفعالية بالعربي"
                />
              </div>

              {/* Type + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as SGASEvent['type'] }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="competition">Competition</option>
                    <option value="networking">Networking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as 'past' | 'upcoming' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    <option value="past">Past</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-brand-500" />
                    Date
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Day */}
                  <select
                    value={selDay}
                    onChange={(e) => {
                      const day = parseInt(e.target.value, 10);
                      if (day <= daysInMonth) setSelDay(e.target.value);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => {
                      const d = (i + 1).toString();
                      return (
                        <option key={d} value={d} disabled={i + 1 > daysInMonth}>
                          {d}
                        </option>
                      );
                    })}
                  </select>

                  {/* Month */}
                  <select
                    value={selMonth}
                    onChange={(e) => {
                      setSelMonth(e.target.value);
                      const newMonthIdx = parseInt(e.target.value, 10);
                      const maxDays = new Date(parseInt(selYear), newMonthIdx + 1, 0).getDate();
                      if (parseInt(selDay, 10) > maxDays) setSelDay(maxDays.toString());
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    {monthsEn.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>

                  {/* Year */}
                  <select
                    value={selYear}
                    onChange={(e) => {
                      setSelYear(e.target.value);
                      const newMaxDays = new Date(parseInt(e.target.value), parseInt(selMonth) + 1, 0).getDate();
                      if (parseInt(selDay, 10) > newMaxDays) setSelDay(newMaxDays.toString());
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const y = (currentYear - 2 + i).toString();
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  EN: {formData.dateEn} &nbsp;|&nbsp; AR: {formData.dateAr}
                </p>
              </div>

              {/* Time Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Hour */}
                  <select
                    value={selHour}
                    onChange={(e) => setSelHour(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const h = (i + 1).toString();
                      return <option key={h} value={h}>{h}</option>;
                    })}
                  </select>

                  {/* Minute */}
                  <select
                    value={selMinute}
                    onChange={(e) => setSelMinute(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  {/* AM/PM */}
                  <select
                    value={selAmPm}
                    onChange={(e) => setSelAmPm(e.target.value as 'AM' | 'PM')}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (English)</label>
                  <input
                    value={formData.locationEn}
                    onChange={(e) => setFormData((p) => ({ ...p, locationEn: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                    placeholder="Cairo University"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (Arabic)</label>
                  <input
                    value={formData.locationAr}
                    onChange={(e) => setFormData((p) => ({ ...p, locationAr: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                    dir="rtl"
                    placeholder="جامعة القاهرة"
                  />
                </div>
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                <textarea
                  value={formData.descEn}
                  onChange={(e) => setFormData((p) => ({ ...p, descEn: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm resize-none"
                  placeholder="Event description in English..."
                />
              </div>

              {/* Description AR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
                <textarea
                  value={formData.descAr}
                  onChange={(e) => setFormData((p) => ({ ...p, descAr: e.target.value }))}
                  rows={3}
                  dir="rtl"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm resize-none"
                  placeholder="وصف الفعالية بالعربي..."
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Highlights <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                  placeholder="Free Entry, On-site, Networking"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingEvent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
