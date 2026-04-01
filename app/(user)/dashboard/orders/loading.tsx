// app/(user)/dashboard/orders/loading.tsx
import { TableSkeleton, OrdersLoading } from "@/components/ui/loadings";

export default function loading() {
  return (
    <div className="space-y-6">
      <OrdersLoading />
    </div>
  );
}
