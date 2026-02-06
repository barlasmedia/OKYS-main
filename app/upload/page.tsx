'use client';

import { useState } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { processXmlAction } from '../actions/xml-processor';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('loading');
        setMessage('XML dosyası işleniyor...');

        try {
            const formData = new FormData();
            formData.append('xmlFile', file);

            const result = await processXmlAction(formData);

            if (result.success) {
                setStatus('success');
                setMessage(result.message);
            } else {
                setStatus('error');
                setMessage(result.error || 'Bir hata oluştu.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Bağlantı hatası oluştu.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Veri Yükleme</h1>
                <p className="text-zinc-400 mt-2">aSc Timetables XML dosyasını sisteme aktarın.</p>
            </div>

            <Card className="max-w-2xl">
                <div className="space-y-6">
                    <div
                        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 transition-all ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                            }`}
                    >
                        <div className={`p-4 rounded-2xl ${file ? 'bg-blue-500/20 text-blue-500' : 'bg-white/5 text-zinc-500'}`}>
                            {file ? <FileCode className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>

                        <div className="text-center">
                            <label htmlFor="file-upload" className="cursor-pointer group">
                                <span className="text-blue-500 font-semibold group-hover:text-blue-400 transition-colors">Dosya seçin</span>
                                <span className="text-zinc-400"> veya buraya sürükleyin</span>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".xml"
                                    onChange={handleFileChange}
                                />
                            </label>
                            <p className="text-sm text-zinc-500 mt-2">Desteklenen format: .xml (aSc Export)</p>
                        </div>

                        {file && (
                            <div className="text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 mt-4">
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || status === 'loading'}
                        className={`w-full py-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-base transition-all active:scale-[0.98] ${!file || status === 'loading'
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            }`}
                    >
                        {status === 'loading' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" />
                        )}
                        <span>{status === 'loading' ? 'İşleniyor...' : 'Veritabanına Aktar'}</span>
                    </button>

                    {status !== 'idle' && (
                        <div className={`p-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            status === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                            {status === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> :
                                status === 'error' ? <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" /> :
                                    <Loader2 className="w-5 h-5 mt-0.5 shrink-0 animate-spin" />}
                            <div className="text-sm">
                                <p className="font-semibold">{status === 'success' ? 'Başarılı' : status === 'error' ? 'Hata' : 'İşlem Sürüyor'}</p>
                                <p className="opacity-90">{message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <Card className="p-4 bg-zinc-900/50">
                    <h3 className="text-sm font-semibold text-zinc-300">Neden XML Yüklemeliyim?</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        aSc Timetables üzerinden yaptığınız haftalık ders programlarını tek tıkla sisteme aktararak öğretmen ve sınıf görevlerini otomatik oluşturabilirsiniz.
                    </p>
                </Card>
                <Card className="p-4 bg-zinc-900/50">
                    <h3 className="text-sm font-semibold text-zinc-300">Dikkat Edilmesi Gerekenler</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Dosyanın "XML Veritabanı" formatında dışa aktarıldığından emin olun. Mevcut veriler okul kimliği bazında güncellenecektir.
                    </p>
                </Card>
            </div>
        </div>
    );
}
