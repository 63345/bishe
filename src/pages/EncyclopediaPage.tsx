import { useState, useMemo } from 'react';
import { Search, Book, Image as ImageIcon, X, ArrowRight, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ENCYCLOPEDIA_DATA, ENCYCLOPEDIA_CATEGORIES, EncyclopediaEntry } from '../data/encyclopedia';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function EncyclopediaPage() {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [selectedEntry, setSelectedEntry] = useState<EncyclopediaEntry | null>(null);

    // Allow routing to specific keyword
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const keyword = params.get('keyword');
        if (keyword) {
            setSearchQuery(keyword);
            // Try to auto-open if exact match
            const exactMatch = ENCYCLOPEDIA_DATA.find(e => e.title.includes(keyword) || e.tags.includes(keyword));
            if (exactMatch) {
                setSelectedEntry(exactMatch);
            }
        }
    }, [location]);

    const filteredData = useMemo(() => {
        return ENCYCLOPEDIA_DATA.filter((item) => {
            const matchCategory = activeCategory === 'all' || item.category === activeCategory;
            const matchSearch =
                item.title.includes(searchQuery) ||
                item.content.includes(searchQuery) ||
                item.tags.some((tag) => tag.includes(searchQuery));
            return matchCategory && matchSearch;
        });
    }, [searchQuery, activeCategory]);

    const getRelatedEntries = (current: EncyclopediaEntry) => {
        return ENCYCLOPEDIA_DATA.filter(
            (e) => e.id !== current.id && e.tags.some((t) => current.tags.includes(t))
        ).slice(0, 3);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Header Search & Filters */}
            <div className="p-4 sm:p-6 pb-2">
                <div className="max-w-6xl mx-auto space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Book className="w-6 h-6 text-emerald-600" />
                                水产百科
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">汇聚20年大闸蟹养殖理论与实践精华</p>
                        </div>

                        {/* Search Box */}
                        <div className="w-full sm:w-72 relative">
                            <input
                                type="text"
                                placeholder="搜索疾病、症状、水草..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${activeCategory === 'all'
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            全部
                        </button>
                        {ENCYCLOPEDIA_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                  ${activeCategory === cat
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Encyclopedia Grid (Waterfall style logic) */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map(entry => (
                        <div
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className="bg-[#fcfdfc] border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-full"
                        >
                            {/* Actual thumbnail or fake thumbnail if no explicit image */}
                            {entry.imageUrls && entry.imageUrls.length > 0 ? (
                                <div className="h-40 w-full border-b border-slate-100 overflow-hidden shrink-0">
                                    <img src={entry.imageUrls[0]} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ) : (
                                <div className="h-40 w-full bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-center border-b border-slate-100 group-hover:scale-105 transition-transform duration-500 origin-bottom shrink-0">
                                    <Layers className="w-10 h-10 text-emerald-200" />
                                </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col relative bg-white z-10">
                                <div className="text-xs font-semibold text-emerald-600 mb-2">{entry.category}</div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{entry.title}</h3>

                                {/* Intro abstract logic */}
                                <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                                    {entry.content.replace(/#/g, '').slice(0, 100)}...
                                </p>

                                <div className="flex flex-wrap gap-1 mt-auto">
                                    {entry.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] px-2 py-1 bg-slate-50 text-slate-500 rounded-md border border-slate-100">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredData.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <Book className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>未找到相关百科内容，请尝试其他关键词。</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Drawer Overlay */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEntry(null)}>
                    <div
                        className="w-full sm:w-[500px] h-full bg-[#fdfdfc] shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-white">
                            <div className="font-medium text-emerald-600 text-sm">{selectedEntry.category}</div>
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {selectedEntry.imageUrls && selectedEntry.imageUrls.length > 0 && (
                                <div className="w-full h-56 relative bg-slate-900 overflow-hidden">
                                    <img src={selectedEntry.imageUrls[0]} alt={selectedEntry.title} className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fdfdfc] to-transparent"></div>
                                </div>
                            )}

                            <div className="p-6 sm:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">{selectedEntry.title}</h2>

                                <div className="prose prose-emerald prose-slate max-w-none text-slate-700 leading-loose prose-h2:text-slate-800 prose-h2:border-b prose-h2:pb-2 prose-h3:text-slate-800 mb-10">
                                    <ReactMarkdown>{selectedEntry.content}</ReactMarkdown>
                                </div>              </div>

                            {/* Related knowledge association */}
                            {getRelatedEntries(selectedEntry).length > 0 && (
                                <div className="mt-8 pt-8 border-t border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                        <Layers className="w-4 h-4 text-emerald-500" />
                                        相关知识关联
                                    </h4>
                                    <div className="space-y-3">
                                        {getRelatedEntries(selectedEntry).map(related => (
                                            <div
                                                key={related.id}
                                                onClick={() => setSelectedEntry(related)}
                                                className="p-3 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between cursor-pointer group transition-colors"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-emerald-900">{related.title}</span>
                                                    <span className="text-xs text-emerald-600/70">{related.category}</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors transform group-hover:translate-x-1" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
