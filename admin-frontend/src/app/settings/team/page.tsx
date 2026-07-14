import prisma from "@/lib/prisma";
import TeamTable from "./TeamTable";

export default async function TeamPage() {
  const admins = await prisma.systemAdmin.findMany({
    include: { role: true },
    orderBy: { createdAt: "desc" }
  });

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Team Members</h1>
          <p className="text-sm text-gray-400 mt-1">Manage system administrators and granular access roles.</p>
        </div>
      </div>
      
      <TeamTable initialAdmins={admins} roles={roles} />
    </div>
  );
}
