import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandLogo from './BrandLogo'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Features', to: '/features' },
    { name: 'How it Works', to: '/how-it-works' },
    { name: 'Use Cases', to: '/use-cases' },
    { name: 'Architecture', to: '/architecture' },
    { name: 'FAQs', to: '/faqs' },
    // Support navigation item removed as per request
    { name: 'Sign In', to: '/login' },
  ]

  return (
    <header className="bg-slate-950 border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <BrandLogo size={32} />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            {/* Show user avatar / logout when authenticated */}
            {user && (
              <button
                onClick={logout}
                className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            {/* Mobile logout button */}
            {user && (
              <button
                onClick={logout}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
