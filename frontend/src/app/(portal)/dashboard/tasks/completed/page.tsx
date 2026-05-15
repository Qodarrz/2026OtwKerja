import { TaskListView } from "@/components/dashboard/TaskListView";
export default function CompletedTasksPage() {
  return (
    <TaskListView
      title="Sudah Selesai"
      description="Rekapitulasi berkas yang telah selesai diproses dan divalidasi."
      filterStatus="COMPLETED"
    />
  );
}
