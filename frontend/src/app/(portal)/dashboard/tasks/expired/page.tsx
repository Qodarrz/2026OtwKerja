import { TaskListView } from "@/components/dashboard/TaskListView";
export default function ExpiredTasksPage() {
  return (
    <TaskListView
      title="Melewati Batas (SLA)"
      description="Daftar berkas yang telah melewati batas waktu SLA dan memerlukan penanganan prioritas."
      filterStatus="EXPIRED"
    />
  );
}
