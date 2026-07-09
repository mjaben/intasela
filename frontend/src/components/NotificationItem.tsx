import { useRouter } from 'next/navigation';

export default function NotificationItem({ notification }: { notification: any }) {
  const router = useRouter();

  const handleNavigate = () => {
    if (notification.type === 'FOLLOW') {
      router.push(`/@${notification.actor.username}`);
    } else if (notification.postId) {
      router.push(`/@${notification.actor.username}/posts/${notification.postId}`);
    }
  };

  const renderIcon = () => {
    switch (notification.type) {
      case 'LIKE':
        return <svg className="text-pink-500 w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
      case 'RESELA':
        return <svg className="text-green-500 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h13.8"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3.2"/></svg>;
      case 'REPLY':
        return <svg className="text-blue-500 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
      case 'QUOTE':
        return <svg className="text-purple-500 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>;
      case 'FOLLOW':
        return <svg className="text-white w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>;
      default:
        return <div className="w-6 h-6" />;
    }
  };

  const renderText = () => {
    switch (notification.type) {
      case 'LIKE': return <span className="font-bold">{notification.actor.firstName || notification.actor.username}</span>;
      case 'RESELA': return <span className="font-bold">{notification.actor.firstName || notification.actor.username}</span>;
      case 'REPLY': return <span className="font-bold">{notification.actor.firstName || notification.actor.username}</span>;
      case 'QUOTE': return <span className="font-bold">{notification.actor.firstName || notification.actor.username}</span>;
      case 'FOLLOW': return <span className="font-bold">{notification.actor.firstName || notification.actor.username}</span>;
      default: return null;
    }
  };
  
  const getActionText = () => {
    switch (notification.type) {
      case 'LIKE': return 'liked your post';
      case 'RESELA': return "resela'd your post";
      case 'REPLY': return 'replied to your post';
      case 'QUOTE': return 'quoted your post';
      case 'FOLLOW': return 'followed you';
      default: return '';
    }
  }

  return (
    <div 
      onClick={handleNavigate}
      className={`border-b border-border p-4 sm:p-5 flex gap-4 cursor-pointer hover:bg-accent/50 transition-colors ${!notification.isRead ? 'bg-muted/20' : ''}`}
    >
      <div className="flex flex-col items-end pt-1">
        {renderIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {notification.actor.avatarUrl ? (
            <img src={notification.actor.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
              {(notification.actor.firstName?.[0] || notification.actor.username[0]).toUpperCase()}
            </div>
          )}
        </div>
        
        <p className="text-[15px] mb-1">
          {renderText()} {getActionText()}
        </p>
        
        {notification.post && notification.post.content && (
          <p className="text-[14px] text-muted-foreground line-clamp-2">
            {notification.post.content}
          </p>
        )}
      </div>
    </div>
  );
}
