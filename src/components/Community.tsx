import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, BarChart2, Image, X, Send, PlusCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../app/main';
import { initialPosts, SocialPost, PostComment, Poll } from '../data/mockData';

// ─── Storage ──────────────────────────────────────────────────────────────────

function loadPosts(): SocialPost[] {
  try {
    const s = localStorage.getItem('gorugby_posts');
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  const seed = [...initialPosts];
  localStorage.setItem('gorugby_posts', JSON.stringify(seed));
  return seed;
}

function savePosts(p: SocialPost[]) { localStorage.setItem('gorugby_posts', JSON.stringify(p)); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'Ahora';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function daysRemaining(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

// ─── Poll Widget ──────────────────────────────────────────────────────────────

function PollWidget({ poll, postId, onVote }: {
  poll: Poll;
  postId: string;
  onVote: (postId: string, optionId: string) => void;
}) {
  const { user } = useAuth();
  const hasVoted  = user ? poll.voters.includes(user.id) : false;
  const total     = poll.options.reduce((s, o) => s + o.votes, 0);
  const maxVotes  = Math.max(...poll.options.map(o => o.votes));
  const days      = daysRemaining(poll.expiresAt);
  const expired   = days === 0;
  const canVote   = !hasVoted && !expired && !!user;

  return (
    <div className="poll-widget">
      <div className="poll-widget-options">
        {poll.options.map(opt => {
          const pct      = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
          const isLeader = opt.votes === maxVotes && total > 0;

          if (canVote) {
            return (
              <button key={opt.id} className="poll-vote-btn" onClick={() => onVote(postId, opt.id)}>
                {opt.text}
              </button>
            );
          }

          return (
            <div key={opt.id} className={`poll-result-row${isLeader ? ' leader' : ''}`}>
              <div className="poll-result-fill" style={{ width: `${pct}%` }} />
              <div className="poll-result-content">
                <span className="poll-result-text">
                  {isLeader && <TrendingUp size={11} style={{ marginRight: 4 }} />}
                  {opt.text}
                </span>
                <span className="poll-result-pct">{pct}%</span>
              </div>
              <div className="poll-result-votes">{opt.votes.toLocaleString('es-AR')} votos</div>
            </div>
          );
        })}
      </div>
      <div className="poll-widget-footer">
        <BarChart2 size={12} />
        <span>{total.toLocaleString('es-AR')} votos en total</span>
        <span className="poll-sep">·</span>
        {expired
          ? <span className="poll-expired">Encuesta finalizada</span>
          : <span>Cierra en {days} día{days !== 1 ? 's' : ''}</span>}
        {!user && <span className="poll-sep">· Iniciá sesión para votar</span>}
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onLike, onComment, onVote }: {
  post: SocialPost;
  onLike: (id: string) => void;
  onComment: (postId: string, text: string) => void;
  onVote: (postId: string, optionId: string) => void;
}) {
  const { user }           = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const liked = user ? post.likedBy.includes(user.id) : false;

  const submitComment = () => {
    if (!commentText.trim() || !user) return;
    onComment(post.id, commentText.trim());
    setCommentText('');
  };

  const initials = user ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?';

  return (
    <article className="social-post">
      <div className="social-avatar">{post.userInitials}</div>

      <div className="social-post-body">
        {/* Header */}
        <div className="social-post-header">
          <span className="social-post-name">{post.userName}</span>
          <span className="social-post-handle">@{post.userId}</span>
          <span className="social-sep">·</span>
          <span className="social-post-time">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Text */}
        <p className="social-post-text">{post.text}</p>

        {/* Image */}
        {post.imageUrl && (
          <div className="social-post-img">
            <img
              src={post.imageUrl}
              alt="Imagen del post"
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Poll */}
        {post.type === 'poll' && post.poll && (
          <PollWidget poll={post.poll} postId={post.id} onVote={onVote} />
        )}

        {/* Action bar */}
        <div className="social-actions">
          <button
            className={`social-action-btn${showComments ? ' active' : ''}`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={15} />
            {post.comments.length > 0 && <span>{post.comments.length}</span>}
          </button>
          <button className="social-action-btn">
            <Repeat2 size={15} />
            {post.reposts > 0 && <span>{post.reposts}</span>}
          </button>
          <button
            className={`social-action-btn like${liked ? ' liked' : ''}`}
            onClick={() => onLike(post.id)}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            {post.likes > 0 && <span>{post.likes}</span>}
          </button>
        </div>

        {/* Comments thread */}
        {showComments && (
          <div className="social-thread">
            {post.comments.map(c => (
              <div key={c.id} className="thread-comment">
                <div className="thread-avatar">{c.userInitials}</div>
                <div className="thread-comment-body">
                  <div className="thread-comment-header">
                    <span className="thread-comment-name">{c.userName}</span>
                    <span className="social-sep">·</span>
                    <span className="thread-comment-time">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="thread-comment-text">{c.text}</p>
                  <button className={`social-action-btn small${user && c.likedBy.includes(user.id) ? ' liked' : ''}`}>
                    <Heart size={11} fill={user && c.likedBy.includes(user.id) ? 'currentColor' : 'none'} />
                    {c.likes > 0 && <span>{c.likes}</span>}
                  </button>
                </div>
              </div>
            ))}

            {user && (
              <div className="thread-compose">
                <div className="thread-avatar small">{initials}</div>
                <div className="thread-input-wrap">
                  <input
                    className="thread-input"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Respondé..."
                    onKeyDown={e => e.key === 'Enter' && submitComment()}
                  />
                  <button
                    className="thread-send"
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Post Composer ────────────────────────────────────────────────────────────

function PostComposer({ onPost }: {
  onPost: (text: string, imageUrl?: string, poll?: Poll) => void;
}) {
  const { user } = useAuth();
  const [text,          setText]          = useState('');
  const [imageUrl,      setImageUrl]      = useState('');
  const [showImg,       setShowImg]       = useState(false);
  const [isPoll,        setIsPoll]        = useState(false);
  const [pollOptions,   setPollOptions]   = useState(['', '']);
  const [pollDays,      setPollDays]      = useState(7);

  if (!user) return null;

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('');
  const charsLeft = 280 - text.length;
  const canPost   = text.trim().length > 0 && charsLeft >= 0;

  const submit = () => {
    if (!canPost) return;
    let poll: Poll | undefined;
    if (isPoll) {
      const validOpts = pollOptions.filter(o => o.trim());
      if (validOpts.length >= 2) {
        const exp = new Date();
        exp.setDate(exp.getDate() + pollDays);
        poll = {
          id: `poll_${Date.now()}`,
          question: text.trim(),
          options: validOpts.map((o, i) => ({ id: `po${i}`, text: o.trim(), votes: 0 })),
          expiresAt: exp.toISOString().split('T')[0],
          voters: [],
        };
      }
    }
    onPost(text.trim(), showImg && imageUrl.trim() ? imageUrl.trim() : undefined, poll);
    setText(''); setImageUrl(''); setShowImg(false);
    setIsPoll(false); setPollOptions(['', '']);
  };

  const toggleImg  = () => { setShowImg(!showImg); setIsPoll(false); };
  const togglePoll = () => { setIsPoll(!isPoll);   setShowImg(false); };

  return (
    <div className="post-composer">
      <div className="social-avatar composer-self">{initials}</div>
      <div className="composer-body">
        <textarea
          className="composer-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={isPoll ? '¿Cuál es tu pregunta?' : '¿Qué está pasando en el rugby?'}
          rows={3}
        />

        {showImg && (
          <div className="composer-img-row">
            <input
              className="composer-img-input"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="URL de imagen o meme..."
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="preview"
                className="composer-img-preview"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        )}

        {isPoll && (
          <div className="composer-poll">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="composer-poll-row">
                <input
                  className="composer-poll-input"
                  value={opt}
                  onChange={e => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={idx < 2 ? `Opción ${idx + 1}` : `Opción ${idx + 1} (opcional)`}
                />
                {idx >= 2 && (
                  <button className="composer-poll-remove" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button className="composer-poll-add" onClick={() => setPollOptions([...pollOptions, ''])}>
                <PlusCircle size={13} /> Agregar opción
              </button>
            )}
            <div className="composer-poll-duration">
              <span className="composer-poll-duration-label">Duración:</span>
              {[1, 3, 7, 14].map(d => (
                <button
                  key={d}
                  className={`filter-chip${pollDays === d ? ' active' : ''}`}
                  onClick={() => setPollDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="composer-footer">
          <div className="composer-tools">
            <button className={`composer-tool${showImg ? ' active' : ''}`} onClick={toggleImg} title="Agregar imagen">
              <Image size={17} />
            </button>
            <button className={`composer-tool${isPoll ? ' active' : ''}`} onClick={togglePoll} title="Crear encuesta">
              <BarChart2 size={17} />
            </button>
          </div>
          <div className="composer-submit-row">
            <span className={`composer-chars${charsLeft < 20 ? ' warn' : ''}${charsLeft < 0 ? ' over' : ''}`}>
              {charsLeft}
            </span>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={!canPost}>
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>(loadPosts);

  const createPost = (text: string, imageUrl?: string, poll?: Poll) => {
    if (!user) return;
    const np: SocialPost = {
      id: `post_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userInitials: user.name.split(' ').map(w => w[0]).slice(0, 2).join(''),
      text,
      imageUrl,
      type: poll ? 'poll' : 'post',
      poll,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comments: [],
      reposts: 0,
    };
    const updated = [np, ...posts];
    setPosts(updated);
    savePosts(updated);
  };

  const likePost = (postId: string) => {
    if (!user) return;
    const updated = posts.map(p => {
      if (p.id !== postId) return p;
      const liked = p.likedBy.includes(user.id);
      return {
        ...p,
        likes: liked ? p.likes - 1 : p.likes + 1,
        likedBy: liked ? p.likedBy.filter(id => id !== user.id) : [...p.likedBy, user.id],
      };
    });
    setPosts(updated);
    savePosts(updated);
  };

  const commentOnPost = (postId: string, text: string) => {
    if (!user) return;
    const nc: PostComment = {
      id: `c_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userInitials: user.name.split(' ').map(w => w[0]).slice(0, 2).join(''),
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };
    const updated = posts.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, nc] } : p
    );
    setPosts(updated);
    savePosts(updated);
  };

  const votePoll = (postId: string, optionId: string) => {
    if (!user) return;
    const updated = posts.map(p => {
      if (p.id !== postId || !p.poll) return p;
      if (p.poll.voters.includes(user.id)) return p;
      return {
        ...p,
        poll: {
          ...p.poll,
          voters: [...p.poll.voters, user.id],
          options: p.poll.options.map(o =>
            o.id === optionId ? { ...o, votes: o.votes + 1 } : o
          ),
        },
      };
    });
    setPosts(updated);
    savePosts(updated);
  };

  return (
    <div className="community-page">
      <div className="social-feed">
        <PostComposer onPost={createPost} />
        <div className="feed-divider" />
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onLike={likePost}
            onComment={commentOnPost}
            onVote={votePoll}
          />
        ))}
      </div>
    </div>
  );
}
