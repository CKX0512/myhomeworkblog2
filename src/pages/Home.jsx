import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import zhCN from 'date-fns/locale/zh-CN'
import './Home.css'

function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    if (!supabase) {
      console.error('❌ Supabase 客户端未初始化')
      setError('Supabase 未正确配置，请检查 .env 文件')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('🔄 开始加载文章...')
      console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '已配置' : '未配置')
      
      // 查询所有文章
      console.log('📤 发送查询请求...')
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('📥 收到响应')

      if (postsError) {
        console.error('❌ 查询文章失败:', postsError)
        console.error('错误详情:', {
          message: postsError.message,
          code: postsError.code,
          details: postsError.details,
          hint: postsError.hint
        })
        throw postsError
      }

      console.log('✅ 成功获取文章数据:', postsData?.length || 0, '篇')

      // 如果没有文章，设置空数组并结束加载
      if (!postsData || postsData.length === 0) {
        console.log('ℹ️ 数据库中没有文章')
        setPosts([])
        setLoading(false)
        return
      }

      // 获取所有唯一的 author_id
      const authorIds = [...new Set(postsData.map(post => post.author_id).filter(Boolean))]
      
      // 批量查询用户信息（如果查询失败，不影响文章显示）
      let usersMap = {}
      if (authorIds.length > 0) {
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, username')
            .in('id', authorIds)

          if (usersError) {
            // 如果查询用户失败，只记录错误，不阻止文章显示
            console.warn('Error fetching users (non-blocking):', usersError)
          } else if (usersData) {
            // 创建用户映射
            usersMap = usersData.reduce((acc, user) => {
              acc[user.id] = user
              return acc
            }, {})
          }
        } catch (userErr) {
          // 查询用户失败不影响文章显示
          console.warn('Error fetching users (non-blocking):', userErr)
        }
      }

      // 合并文章和用户信息
      const postsWithUsers = postsData.map(post => ({
        ...post,
        users: usersMap[post.author_id] || null
      }))

      console.log('✅ 文章数据准备完成，共', postsWithUsers.length, '篇')
      setPosts(postsWithUsers)
    } catch (err) {
      const errorMessage = err.message || '加载文章失败'
      setError(errorMessage)
      console.error('❌ 加载文章时发生错误:', err)
      console.error('错误详情:', {
        message: err.message,
        code: err.code,
        name: err.constructor.name,
        stack: err.stack
      })
      
      // 即使出错，也设置空数组，避免页面一直加载
      setPosts([])
    } finally {
      console.log('🏁 加载流程结束，设置 loading = false')
      setLoading(false)
      // 双重保险：如果 1 秒后还在加载，强制设置为 false
      setTimeout(() => {
        setLoading(prev => {
          if (prev) {
            console.warn('⚠️ 检测到 loading 状态异常，强制设置为 false')
            return false
          }
          return prev
        })
      }, 1000)
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

  if (error) {
    return (
      <div className="error-container">
        <p>❌ 加载失败: {error}</p>
      </div>
    )
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1 className="home-title">最新文章</h1>
        <p className="home-subtitle">分享我的学习与思考</p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h2>还没有文章</h2>
          <p>开始写你的第一篇文章吧！</p>
          <Link to="/create" className="btn btn-primary">
            写文章
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <Link to={`/post/${post.id}`}>
                <div className="post-card-header">
                  <h2 className="post-title">{post.title || '无标题'}</h2>
                  <div className="post-meta">
                    <span className="post-author">
                      {post.users?.username || '匿名'}
                    </span>
                    <span className="post-date">
                      {format(new Date(post.created_at), 'yyyy年MM月dd日', { locale: zhCN })}
                    </span>
                  </div>
                </div>
                <div className="post-card-body">
                  <p className="post-excerpt">
                    {post.content 
                      ? (post.content.length > 150 
                          ? post.content.substring(0, 150) + '...' 
                          : post.content)
                      : '暂无内容'}
                  </p>
                </div>
                <div className="post-card-footer">
                  <span className="read-more">阅读更多 →</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home

