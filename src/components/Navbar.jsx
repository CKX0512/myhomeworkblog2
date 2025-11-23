import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📝</span>
          <span className="brand-text">我的博客</span>
        </Link>
        <ul className="navbar-menu">
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              首页
            </Link>
          </li>
          {user && (
            <li>
              <Link 
                to="/create" 
                className={location.pathname === '/create' ? 'active' : ''}
              >
                写文章
              </Link>
            </li>
          )}
          <li>
            <Link 
              to="/about" 
              className={location.pathname === '/about' ? 'active' : ''}
            >
              关于
            </Link>
          </li>
          {user ? (
            <>
              <li className="navbar-user">
                <span className="user-name">
                  {userProfile?.username || user.email?.split('@')[0] || '用户'}
                </span>
              </li>
              <li>
                <button 
                  onClick={handleSignOut}
                  className="btn-logout"
                >
                  登出
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link 
                  to="/login" 
                  className={location.pathname === '/login' ? 'active' : ''}
                >
                  登录
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className={location.pathname === '/register' ? 'active' : 'btn-register'}
                >
                  注册
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar

