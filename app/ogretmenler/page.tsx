import { getTeachers } from '../actions/teachers';
import { TeacherList } from '../../components/teachers/teacher-list';

export default async function TeachersPage() {
    const teachers = await getTeachers();

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Öğretmen Yönetimi</h1>
            <TeacherList initialTeachers={teachers} />
        </div>
    );
}
