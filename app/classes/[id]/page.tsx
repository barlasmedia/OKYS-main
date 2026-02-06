import { getClassDetails } from '../../actions/timetable';
import ClassDetailCard from '../../../components/classes/ClassDetailCard';
import { Button } from '../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
    let data;
    try {
        data = await getClassDetails(params.id);
    } catch (error) {
        redirect('/classes');
    }

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div className="flex items-center space-x-4">
                <Link href="/classes">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Geri Dön
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-white tracking-tight">Sınıf Detayı</h1>
            </div>

            <ClassDetailCard data={data} />
        </div>
    );
}
