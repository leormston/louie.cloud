import { useState, useEffect } from 'react'
import '../css/Footer.css'

function Footer() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">© 2026 Louie Demi. All rights reserved.</p>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>
    </footer>
  )
}

export default Footer
