import { SubstitutionManager } from "../../components/substitutions/substitution-manager";
import { getTeachers } from "../actions/substitutions";

export const dynamic = 'force-dynamic';

export default async function SubstitutionsPage() {
    const teachers = await getTeachers();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Ders Doldurma</h1>
                <p className="text-zinc-400 mt-2">
                    Gelmeyen öğretmen yerine ders verecek öğretmenleri bulun ve atayın.
                </p>
            </div>

            <SubstitutionManager initialTeachers={teachers} />
        </div>
    );
}
