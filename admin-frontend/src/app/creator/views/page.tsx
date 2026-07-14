import prisma from "@/lib/prisma";
import EarningsTable from "../EarningsTable";

export const dynamic = "force-dynamic";

export default async function ViewsEarningsPage({
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

  // Query conditions for Views Earnings (IMPRESSION)
  const where: any = {
    type: "IMPRESSION"
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

  // Fetch total count and paginated transactions
  const [totalTransactions, transactions] = await Promise.all([
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
            avatarUrl: true,
          }
        },
        post: {
          select: {
            id: true,
            content: true,
          }
        }
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Views Earnings</h1>
        <p className="text-sm text-gray-400 mt-1">Track financial rewards distributed to creators from valid impressions.</p>
      </div>
      
      <EarningsTable 
        transactions={transactions} 
        totalTransactions={totalTransactions} 
        currentPage={page} 
        pageSize={pageSize}
        earningsType="Views"
      />
    </div>
  );
}
