import prisma from "@/lib/prisma";
import WithdrawalsTable from "./WithdrawalsTable";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  
  const search = params.search || "";
  const sort = params.sort || "desc";
  const status = params.status || "all";
  
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 10;

  // Query conditions for Withdrawals
  const where: any = {
    type: "WITHDRAWAL"
  };

  // Search filter (User Name or Username)
  if (search) {
    where.user = {
      OR: [
        { username: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } }
      ]
    };
  }

  // Status filter
  if (status !== "all") {
    where.status = status.toUpperCase();
  }

  // Determine sorting logic
  let orderBy: any = { createdAt: "desc" };
  if (sort === "asc") orderBy = { createdAt: "asc" };
  else if (sort === "highest") orderBy = { amount: "desc" };
  else if (sort === "lowest") orderBy = { amount: "asc" };

  // Fetch total count, paginated transactions, and aggregates
  const [totalTransactions, transactions, aggregateMetrics] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            paymentSettings: true,
          }
        },
      }
    }),
    prisma.transaction.groupBy({
      by: ['status'],
      where: { type: "WITHDRAWAL" },
      _sum: { amount: true },
    })
  ]);

  // Date boundaries for new metrics
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const startOf90Days = new Date(now);
  startOf90Days.setDate(now.getDate() - 90);

  // Fetch time-based metrics
  const [
    reqCountDay, reqCountWeek, reqCountMonth, reqCount90,
    payDay, payWeek, payMonth, pay90
  ] = await Promise.all([
    // Request counts (all statuses)
    prisma.transaction.count({ where: { type: "WITHDRAWAL", createdAt: { gte: startOfDay } } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", createdAt: { gte: startOfWeek } } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", createdAt: { gte: startOfMonth } } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", createdAt: { gte: startOf90Days } } }),
    // Payout sums (only COMPLETED)
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED", createdAt: { gte: startOfDay } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED", createdAt: { gte: startOfWeek } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED", createdAt: { gte: startOf90Days } },
      _sum: { amount: true }
    })
  ]);

  const payoutToday = payDay._sum.amount || 0;
  const payoutWeek = payWeek._sum.amount || 0;
  const payoutMonth = payMonth._sum.amount || 0;
  const payout90Days = pay90._sum.amount || 0;

  // Process aggregates
  let totalPending = 0;
  let totalPaid = 0;
  
  aggregateMetrics.forEach((metric) => {
    if (metric.status === "PENDING") {
      totalPending = metric._sum.amount || 0;
    } else if (metric.status === "COMPLETED") {
      totalPaid = metric._sum.amount || 0;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Withdrawal Requests</h1>
        <p className="text-sm text-gray-400 mt-1">Review, approve, or reject creator payout requests.</p>
      </div>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Payout Amounts */}
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Paid Today</span>
          <span className="text-xl font-bold text-white">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(payoutToday)}</span>
        </div>
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Paid This Week</span>
          <span className="text-xl font-bold text-white">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(payoutWeek)}</span>
        </div>
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Paid This Month</span>
          <span className="text-xl font-bold text-white">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(payoutMonth)}</span>
        </div>
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Paid Last 90 Days</span>
          <span className="text-xl font-bold text-white">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(payout90Days)}</span>
        </div>
        
        {/* Totals */}
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Pending</span>
          <span className="text-xl font-bold text-yellow-500">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalPending)}</span>
        </div>
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Paid Out</span>
          <span className="text-xl font-bold text-brand">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalPaid)}</span>
        </div>

        {/* Request Counts */}
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Reqs Today</span>
          <span className="text-xl font-bold text-gray-300">{reqCountDay}</span>
        </div>
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Reqs This Week</span>
          <span className="text-xl font-bold text-gray-300">{reqCountWeek}</span>
        </div>
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Reqs This Month</span>
          <span className="text-xl font-bold text-gray-300">{reqCountMonth}</span>
        </div>
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-4 flex flex-col">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Reqs 90 Days</span>
          <span className="text-xl font-bold text-gray-300">{reqCount90}</span>
        </div>
      </div>
      
      <WithdrawalsTable 
        transactions={transactions} 
        totalTransactions={totalTransactions} 
        currentPage={page} 
        pageSize={pageSize}
      />
    </div>
  );
}
