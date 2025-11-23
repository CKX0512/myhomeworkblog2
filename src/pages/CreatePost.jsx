import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './CreatePost.css'

function CreatePost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userProfile, loading: authLoading } = useAuth()
  const isEdit = !!id
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    // 如果未登录，重定向到登录页
    if (!authLoading && !user) {
      navigate('/login')
      return
    }

    // 如果已登录，设置作者ID
    if (user) {
      setAuthorId(user.id)
    }

    if (isEdit) {
      fetchPost()
    }
  }, [id, user, authLoading, navigate])

  const fetchPost = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTitle(data.title || '')
      setContent(data.content || '')
      setAuthorId(data.author_id || '')
    } catch (err) {
      alert('加载文章失败: ' + err.message)
      console.error('Error fetching post:', err)
      navigate('/')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('请输入文章标题')
      return
    }

    if (!supabase) {
      alert('Supabase 未正确配置，请检查环境变量')
      return
    }

    try {
      setLoading(true)
      
      if (isEdit) {
        const { data, error } = await supabase
          .from('posts')
          .update({
            title: title.trim(),
            content: content.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('Error updating post:', error)
          throw error
        }
        
        if (data) {
          navigate(`/post/${id}`)
        } else {
          throw new Error('更新失败，未返回数据')
        }
      } else {
        if (!user || !authorId) {
          alert('请先登录')
          navigate('/login')
          return
        }

        // 确保用户记录存在（如果不存在，尝试创建）
        try {
          const { error: userCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('id', authorId)
            .single()

          if (userCheckError && userCheckError.code === 'PGRST116') {
            // 用户不存在，尝试创建
            const { data: authUser } = await supabase.auth.getUser()
            const defaultUsername = authUser?.user?.email?.split('@')[0] || '用户'
            
            const { error: createUserError } = await supabase
              .from('users')
              .insert([
                {
                  id: authorId,
                  username: defaultUsername,
                },
              ])

            if (createUserError) {
              console.warn('Warning: Could not create user record:', createUserError)
              // 继续尝试插入文章，因为外键约束可能允许直接使用 auth.users.id
            }
          }
        } catch (userErr) {
          console.warn('Warning: Error checking user:', userErr)
          // 继续尝试插入文章
        }

        // 插入文章
        const { data, error } = await supabase
          .from('posts')
          .insert([
            {
              title: title.trim(),
              content: content.trim(),
              author_id: authorId
            }
          ])
          .select()
          .single()

        if (error) {
          console.error('Error creating post:', error)
          // 提供更详细的错误信息
          if (error.code === '23503') {
            throw new Error('创建失败：用户不存在，请先确保已正确注册')
          } else if (error.code === '42501') {
            throw new Error('创建失败：权限不足，请检查数据库RLS策略')
          } else {
            throw error
          }
        }
        
        if (data && data.id) {
          navigate(`/post/${data.id}`)
        } else {
          throw new Error('创建失败，未返回文章ID')
        }
      }
    } catch (err) {
      const errorMessage = err.message || '保存失败，请稍后重试'
      alert('保存失败: ' + errorMessage)
      console.error('Error saving post:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || fetching) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="create-post">
      <div className="create-post-header">
        <h1>{isEdit ? '编辑文章' : '写新文章'}</h1>
        <p>{isEdit ? '修改你的文章内容' : '分享你的想法和知识'}</p>
      </div>

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="title">文章标题 *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">文章内容</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始写作..."
            rows="20"
            className="form-textarea"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '保存中...' : isEdit ? '更新文章' : '发布文章'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreatePost

