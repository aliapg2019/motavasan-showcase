'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Search, RefreshCw, Copy, Trash2, ChevronDown,
  MessageSquare, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Generation } from './shared/types';
import { authFetch, copyToClipboard, getCategoryLabel, formatDate } from './shared/helpers';
import { GOALS } from './shared/constants';
import { useToast } from '@/hooks/use-toast';

export default function HistoryTab() {
  const { toast } = useToast();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchGenerations = useCallback(() => {
    setLoading(true);
    authFetch(`/api/generations?search=${search}`)
      .then(r => r.json())
      .then(data => {
        setGenerations(data.generations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    authFetch(`/api/generations?search=${search}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        setGenerations(data.generations || []);
        setLoading(false);
      })
      .catch(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف مطمئن هستید؟')) return;
    const res = await authFetch(`/api/generations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setGenerations(prev => prev.filter(g => g.id !== id));
      toast({ title: 'حذف شد' });
    }
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    toast({ title: 'کپی شد!', description: `${label} کپی شد` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="جستجو در تولیدها..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 input-glow transition-all h-10" />
        </div>
        <Button variant="outline" onClick={fetchGenerations} size="icon" className="h-10 w-10 shrink-0">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl shimmer" />)}</div>
      ) : generations.length === 0 ? (
        <div className="glass-card rounded-xl">
          <CardContent className="p-8 text-center text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>تولیدی یافت نشد</p>
          </CardContent>
        </div>
      ) : (
        <div className="space-y-2">
          {generations.map(gen => (
            <div key={gen.id} className="glass-card rounded-xl overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors"
                onClick={() => setExpandedId(expandedId === gen.id ? null : gen.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{gen.productName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{getCategoryLabel(gen.category)}</Badge>
                    <Badge variant="outline" className="text-[10px]">{GOALS.find(g => g.value === gen.goal)?.label}</Badge>
                    <span className="text-[10px] text-gray-400">{formatDate(gen.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleDelete(gen.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expandedId === gen.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {expandedId === gen.id && gen.result && (
                <div className="border-t border-gray-100 dark:border-white/5 p-4 bg-gray-50/50 dark:bg-white/2 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {gen.result.captions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-gray-500">
                        <MessageSquare className="h-3 w-3" /> کپشن‌ها
                      </h4>
                      {gen.result.captions.map((c, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg p-3 mb-2 text-sm leading-7 relative group">
                          {c}
                          <Button variant="ghost" size="sm" className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0" onClick={() => handleCopy(c, 'کپشن')}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {gen.result.stories?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-gray-500">استوری</h4>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {gen.result.stories.map((s, i) => (
                          <div key={i} className="min-w-[100px] w-28 h-40 bg-gradient-to-b from-violet-500 to-pink-500 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer text-center" onClick={() => handleCopy(s, `استوری ${i + 1}`)}>
                            <span className="text-white/60 text-xs mb-1">{i + 1}</span>
                            <p className="text-white text-[10px] leading-4">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-gray-500">اسکریپت ریلز</h4>
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-sm space-y-2 leading-7">
                      <p><span className="text-red-500 font-medium">قلاب:</span> {gen.result.reels_script?.hook}</p>
                      <p><span className="text-blue-500 font-medium">بدنه:</span> {gen.result.reels_script?.body}</p>
                      <p><span className="text-emerald-500 font-medium">CTA:</span> {gen.result.reels_script?.cta}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-gray-500">تبلیغ</h4>
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-sm space-y-2 leading-7">
                      <p><span className="font-medium">کوتاه:</span> {gen.result.ads?.short}</p>
                      <p><span className="font-medium">بلند:</span> {gen.result.ads?.long}</p>
                    </div>
                  </div>
                  {gen.result.hashtags?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-gray-500">هشتگ‌ها</h4>
                      <div className="flex flex-wrap gap-1">
                        {gen.result.hashtags.map((h, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => handleCopy(`#${h}`, h)}>#{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
