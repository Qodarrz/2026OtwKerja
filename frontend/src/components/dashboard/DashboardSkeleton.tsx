import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {" "}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        {" "}
        <div className="space-y-4">
          {" "}
          <Skeleton className="h-4 w-32" /> <Skeleton className="h-10 w-64" />{" "}
          <Skeleton className="h-4 w-96" />{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <Skeleton className="h-11 w-32 rounded-xl" />{" "}
          <Skeleton className="h-11 w-40 rounded-xl" />{" "}
        </div>{" "}
      </header>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {" "}
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            {" "}
            <CardContent className="p-6 space-y-4">
              {" "}
              <div className="flex justify-between">
                {" "}
                <Skeleton className="h-12 w-12 rounded-2xl" />{" "}
                <Skeleton className="h-6 w-16 rounded-full" />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <Skeleton className="h-8 w-24" />{" "}
                <Skeleton className="h-4 w-32" />{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>
        ))}{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {" "}
        <div className="lg:col-span-2">
          {" "}
          <Card className="border-none shadow-sm">
            {" "}
            <div className="p-8 border-b border-slate-50 space-y-2">
              {" "}
              <Skeleton className="h-6 w-48" />{" "}
              <Skeleton className="h-4 w-64" />{" "}
            </div>{" "}
            <CardContent className="p-8 space-y-8">
              {" "}
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  {" "}
                  <div className="flex justify-between">
                    {" "}
                    <Skeleton className="h-4 w-32" />{" "}
                    <Skeleton className="h-6 w-16" />{" "}
                  </div>{" "}
                  <Skeleton className="h-4 w-full rounded-full" />{" "}
                </div>
              ))}{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
        <div className="space-y-8">
          {" "}
          <Card className="border-none shadow-sm">
            {" "}
            <div className="p-8 border-b border-slate-50 space-y-2">
              {" "}
              <Skeleton className="h-6 w-32" />{" "}
              <Skeleton className="h-4 w-48" />{" "}
            </div>{" "}
            <CardContent className="p-8 space-y-6">
              {" "}
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  {" "}
                  <Skeleton className="h-4 w-24" />{" "}
                  <Skeleton className="h-2 w-full rounded-full" />{" "}
                </div>
              ))}{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
