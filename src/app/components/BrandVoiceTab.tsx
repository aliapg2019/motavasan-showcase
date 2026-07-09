'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette, Plus, Edit, Trash2, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BrandProfile } from './shared/types';
import { authFetch } from './shared/helpers';
import { TONES, FORMALITY_LEVELS, EMOJI_LEVELS, SLANG_LEVELS } from './shared/constants';
import { useToast } from '@/hooks/use-toast';

export default function BrandVoiceTab() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', tone: 'friendly', formality: 'semi-formal', emojiLevel: 'moderate', slangLevel: 'light' });

  const fetchProfiles = useCallback(() => {
    setLoading(true);
    authFetch('/api/brand-profiles')
      .then(r => r.json())
      .then(data => { setProfiles(data.profiles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    authFetch('/api/brand-profiles')
      .then(r => r.json())
      .then(data => { setProfiles(data.profiles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ name: '', tone: 'friendly', formality: 'semi-formal', emojiLevel: 'moderate', slangLevel: 'light' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name) { toast({ title: 'نام الزامی است', variant: 'destructive' }); return; }
    try {
      if (editingId) {
        const res = await authFetch(`/api/brand-profiles/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        if (res.ok) toast({ title: 'بروزرسانی شد!' });
      } else {
        const res = await authFetch('/api/brand-profiles', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        if (res.ok) toast({ title: 'پروفایل ایجاد شد!' });
      }
      resetForm();
      fetchProfiles();
    } catch {
      toast({ title: 'خطا', variant: 'destructive' });
    }
  };

  const handleEdit = (profile: BrandProfile) => {
    setForm({
      name: profile.name, tone: profile.tone, formality: profile.formality,
      emojiLevel: profile.emojiLevel, slangLevel: profile.slangLevel,
    });
    setEditingId(profile.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف شود؟')) return;
    await authFetch(`/api/brand-profiles/${id}`, { method: 'DELETE' });
    toast({ title: 'حذف شد' });
    fetchProfiles();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <Palette className="h-3.5 w-3.5 text-white" />
          </div>
          صدای برند
        </h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="btn-gradient text-white h-9 text-sm">
          <Plus className="h-4 w-4 ml-1" />
          پروفایل جدید
        </Button>
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{editingId ? 'ویرایش پروفایل' : 'پروفایل جدید'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">نام پروفایل</Label>
                <Input placeholder="مثلاً: برند لوکس" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-glow transition-all h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">لحن</Label>
                <Select value={form.tone} onValueChange={v => setForm({ ...form, tone: v })}>
                  <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">رسمیت</Label>
                <Select value={form.formality} onValueChange={v => setForm({ ...form, formality: v })}>
                  <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMALITY_LEVELS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">سطح ایموجی</Label>
                <Select value={form.emojiLevel} onValueChange={v => setForm({ ...form, emojiLevel: v })}>
                  <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMOJI_LEVELS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">سطح عامیانه</Label>
                <Select value={form.slangLevel} onValueChange={v => setForm({ ...form, slangLevel: v })}>
                  <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SLANG_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="btn-gradient text-white h-9 text-sm">ذخیره</Button>
              <Button variant="outline" onClick={resetForm} className="h-9 text-sm">انصراف</Button>
            </div>
          </CardContent>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl shimmer" />)}</div>
      ) : profiles.length === 0 ? (
        <div className="glass-card rounded-xl">
          <CardContent className="p-8 text-center text-gray-400">
            <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-1">هنوز پروفایل برندی نساخته‌اید</p>
            <p className="text-sm">پروفایل برند به شما کمک می‌کند محتوا با لحن و صدای مخصوص شما تولید شود</p>
          </CardContent>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map(profile => (
            <div key={profile.id} className="glass-card rounded-xl p-4 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-medium text-sm">{profile.name}</p>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(profile)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(profile.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{TONES.find(t => t.value === profile.tone)?.label}</Badge>
                <Badge variant="outline" className="text-[10px]">{FORMALITY_LEVELS.find(f => f.value === profile.formality)?.label}</Badge>
                <Badge variant="outline" className="text-[10px]">ایموجی: {EMOJI_LEVELS.find(e => e.value === profile.emojiLevel)?.label}</Badge>
                <Badge variant="outline" className="text-[10px]">عامیانه: {SLANG_LEVELS.find(s => s.value === profile.slangLevel)?.label}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
