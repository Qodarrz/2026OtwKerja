import { TaskListView } from "@/components/dashboard/TaskListView";
export default function PendingTasksPage() {
  return (
    <TaskListView
      title="Menunggu Tindakan"
      description="Daftar antrean berkas yang perlu divalidasi dan diproses segera."
      filterStatus="PENDING"
    />
  );
}
