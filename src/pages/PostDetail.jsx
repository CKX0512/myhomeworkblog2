import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import zhCN from 'date-fns/locale/zh-CN'
import './PostDetail.css'

function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [id])

  const fetchPost = async () => {
    if (!supabase) {
      setError('Supabase 未正确配置，请检查 .env 文件')
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // 先查询文章
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (postError) {
        console.error('Error fetching post:', postError)
        throw postError
      }

      if (!postData) {
        throw new Error('文章不存在')
      }

      // 如果有 author_id，查询用户信息（失败不影响文章显示）
      let userData = null
      if (postData.author_id) {
        try {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('username')
            .eq('id', postData.author_id)
            .single()

          if (!userError && user) {
            userData = user
          } else if (userError) {
            console.warn('Warning: Could not fetch user info:', userError)
          }
        } catch (userErr) {
          console.warn('Warning: Error fetching user (non-blocking):', userErr)
        }
      }

      // 合并文章和用户信息
      setPost({
        ...postData,
        users: userData
      })
    } catch (err) {
      const errorMessage = err.message || '加载文章失败'
      setError(errorMessage)
      console.error('Error fetching post:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    if (!supabase) return
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching comments:', error)
        setComments([])
        return
      }
      
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
      setComments([])
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentContent.trim()) return

    if (!supabase) {
      alert('Supabase 未正确配置')
      return
    }

    try {
      setSubmitting(true)
      
      // 获取当前用户ID（如果有）
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: id,
            user_id: userId,
            content: commentContent.trim()
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error submitting comment:', error)
        if (error.code === '42501') {
          throw new Error('评论失败：权限不足，请检查数据库RLS策略')
        } else {
          throw error
        }
      }
      
      if (data) {
        setCommentContent('')
        fetchComments()
      }
    } catch (err) {
      const errorMessage = err.message || '评论失败，请稍后重试'
      alert('评论失败: ' + errorMessage)
      console.error('Error submitting comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!supabase) {
      alert('Supabase 未正确配置')
      return
    }

    if (!confirm('确定要删除这篇文章吗？删除后无法恢复！')) return

    try {
      // 先删除关联的评论（如果有外键约束）
      if (comments.length > 0) {
        const { error: commentsError } = await supabase
          .from('comments')
          .delete()
          .eq('post_id', id)

        if (commentsError) {
          console.warn('删除评论时出错（可能没有外键约束）:', commentsError)
          // 继续尝试删除文章
        }
      }

      // 删除文章
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('删除文章错误:', error)
        throw error
      }
      
      navigate('/')
    } catch (err) {
      const errorMessage = err.message || '未知错误'
      alert('删除失败: ' + errorMessage)
      console.error('Error deleting post:', err)
      
      // 显示更详细的错误信息
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        alert('删除失败：这篇文章可能有关联数据（如评论），请先在数据库中手动删除关联数据，或检查数据库的外键约束设置。')
      }
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="error-container">
        <p>❌ {error || '文章不存在'}</p>
        <Link to="/" className="btn btn-primary">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="post-detail">
      <Link to="/" className="back-link">← 返回首页</Link>
      
      <article className="post-article">
        <header className="post-header">
          <h1 className="post-title">{post.title || '无标题'}</h1>
          <div className="post-meta">
            <span className="post-author">
              作者: {post.users?.username || '匿名'}
            </span>
            <span className="post-date">
              {format(new Date(post.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
            </span>
          </div>
        </header>

        <div className="post-content">
          {post.content ? (
            <div className="content-text">
              {post.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph || '\u00A0'}</p>
              ))}
            </div>
          ) : (
            <p className="no-content">暂无内容</p>
          )}
        </div>

        <div className="post-actions">
          <Link to={`/edit/${post.id}`} className="btn btn-secondary">
            编辑文章
          </Link>
          <button onClick={handleDeletePost} className="btn btn-danger">
            删除文章
          </button>
        </div>
      </article>

      <section className="comments-section">
        <h2 className="comments-title">
          评论 ({comments.length})
        </h2>

        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="写下你的评论..."
            rows="4"
            className="comment-input"
            required
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </form>

        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="no-comments">
              <p>还没有评论，来发表第一条吧！</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-content">
                  {comment.content}
                </div>
                <div className="comment-meta">
                  {format(new Date(comment.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default PostDetail

