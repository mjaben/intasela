import prisma from "@/lib/prisma";
import AuditLogsTable from "./AuditLogsTable";
import LogFilters from "./LogFilters";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  
  const search = params.search || "";
  const filterAction = params.action || "all";
  const filterSuccess = params.success || "all";
  
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 15;

  // Query conditions
  const where: any = {};

  if (search) {
    where.OR = [
      { actorId: { contains: search } },
      { resourceType: { contains: search } }
    ];
  }

  if (filterAction !== "all") {
    where.action = filterAction.toUpperCase();
  }

  if (filterSuccess !== "all") {
    where.success = filterSuccess === "true";
  }

  const [totalLogs, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-gray-400 mt-1">Immutable record of all administrative and critical actions.</p>
        </div>
      </div>
      
      {/* Filter component (Client Component) */}
      <LogFilters search={search} filterAction={filterAction} filterSuccess={filterSuccess} />

      <AuditLogsTable 
        logs={logs} 
        totalLogs={totalLogs} 
        currentPage={page} 
        pageSize={pageSize}
      />
    </div>
  );
}
