import prisma from "@/lib/prisma";
import TabbedAnalyticsChart from "./TabbedAnalyticsChart";
import DemographicsCharts from "./DemographicsCharts";

export default async function DashboardOverview() {
  // Fetch real metrics from the database
  const totalUsers = await prisma.user.count();
  
  const totalContent = await prisma.post.count();
  const activeOrbits = await prisma.post.count({ where: { mediaType: "VIDEO" } });
  const activePosts = totalContent - activeOrbits;

  const flaggedContent = await prisma.post.count({ where: { isFlagged: true } });
  
  const revenueAgg = await prisma.transaction.aggregate({ _sum: { amount: true } });
  const totalRevenue = revenueAgg._sum.amount || 0;

  const pendingApprovals = await prisma.approval.count({ where: { status: "PENDING" } });
  
  const totalWithdrawalsAgg = await prisma.transaction.aggregate({ where: { type: "WITHDRAWAL" }, _sum: { amount: true } });
  const totalWithdrawals = totalWithdrawalsAgg._sum.amount || 0;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonthWithdrawalsAgg = await prisma.transaction.aggregate({ where: { type: "WITHDRAWAL", createdAt: { gte: startOfMonth } }, _sum: { amount: true } });
  const thisMonthWithdrawals = thisMonthWithdrawalsAgg._sum.amount || 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Active Users (Today & Month)
  const engagedToday = await prisma.engagement.findMany({ where: { createdAt: { gte: startOfDay } }, select: { userId: true }, distinct: ['userId'] });
  const postedToday = await prisma.post.findMany({ where: { createdAt: { gte: startOfDay } }, select: { authorId: true }, distinct: ['authorId'] });
  const activeUsersToday = new Set([...engagedToday.map(e => e.userId), ...postedToday.map(p => p.authorId)]).size;

  const engagedMonth = await prisma.engagement.findMany({ where: { createdAt: { gte: startOfMonth } }, select: { userId: true }, distinct: ['userId'] });
  const postedMonth = await prisma.post.findMany({ where: { createdAt: { gte: startOfMonth } }, select: { authorId: true }, distinct: ['authorId'] });
  const activeUsersMonth = new Set([...engagedMonth.map(e => e.userId), ...postedMonth.map(p => p.authorId)]).size;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard title="Total Orbits" value={activeOrbits.toLocaleString()} change="Video content" positive icon={
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
        } />
        <StatCard title="Active Users (Today)" value={activeUsersToday.toLocaleString()} change={`${activeUsersMonth.toLocaleString()} this month`} positive icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        } />
        <StatCard title="Flagged Content" value={flaggedContent.toString()} change={flaggedContent > 0 ? "Requires Action" : "All clean"} neutral={flaggedContent === 0} positive={false} icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
        } />
         <StatCard title="Pending Approvals" value={pendingApprovals.toString()} change={pendingApprovals > 0 ? "Awaiting review" : "Up to date"} neutral={pendingApprovals === 0} icon={
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        } />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Platform Revenue" value={new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalRevenue)} change="Live" positive icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v18" /><path d="M18 3v18" /><path d="M6 3l12 18" /><path d="M4 10h16" /><path d="M4 14h16" /></svg>
        } />
        <StatCard title="Total Selas" value={activePosts.toLocaleString()} change="Standard content" positive icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        } />
        <StatCard title="Total Users" value={totalUsers.toLocaleString()} change="All registered accounts" positive icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        } />
        <StatCard title="Total Withdrawals" value={new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalWithdrawals)} change={`${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(thisMonthWithdrawals)} this month`} positive icon={
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
        } />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Chart */}
        <TabbedAnalyticsChart />

        {/* Right Column: Platform Moderation/Activity */}
        <div className="bg-brand-card rounded-xl p-6 shadow-md border border-brand-border/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-300">Pending Actions</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Requires immediate attention</p>
            </div>
          </div>
          <div className="space-y-4">
            <ActionListItem label="Withdrawal Request" detail="₦45,000 via Bank Transfer" subtext="User: alex_dev" />
            <ActionListItem label="Flagged Comment" detail="Hate speech reported" subtext="Post: 'My new tutorial'" />
            <ActionListItem label="Ad Campaign Approval" detail="Tech Conference Promo" subtext="Budget: ₦120,000" />
            <ActionListItem label="Verification Request" detail="Identity documents uploaded" subtext="User: tech_guru" />
          </div>
        </div>
      </div>

      <DemographicsCharts />
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, change, positive, neutral, icon }: { title: string, value: string, change: string, positive?: boolean, neutral?: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-brand-card rounded-xl p-5 shadow-sm border border-brand-border/30 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-300 text-[13px] font-medium tracking-wide">{title}</h3>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-2 tracking-tight">{value}</div>
      <div className={`text-[11px] font-semibold flex items-center gap-1 ${neutral ? 'text-gray-400' : positive ? 'text-brand' : 'text-red-400'}`}>
        {change}
      </div>
    </div>
  );
}

function ActionListItem({ label, detail, subtext }: { label: string, detail: string, subtext: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-brand-border/50 last:border-0">
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-gray-200">{label}</span>
        <span className="text-[11px] text-gray-400">{detail}</span>
      </div>
      <span className="text-[10px] text-brand bg-brand/10 px-2 py-1 rounded font-medium">{subtext}</span>
    </div>
  );
}
