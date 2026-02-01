import { useState } from 'react'
import '../css/Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">
          <a href="/#banner">Louie Demi</a>
        </div>

        <button
          className="hamburger"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={isMenuOpen ? 'open' : ''}></span>
          <span className={isMenuOpen ? 'open' : ''}></span>
          <span className={isMenuOpen ? 'open' : ''}></span>
        </button>

        <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <li><a href="/#experience" onClick={closeMenu}>Experience</a></li>
          <li><a href="/#testimonials" onClick={closeMenu}>Testimonials</a></li>
          {/* <li><a href="/#portfolio" onClick={closeMenu}>Portfolio</a></li> */}
          <li><a href="/#contact" onClick={closeMenu}>Contact</a></li>
          <li><a href="#blog" onClick={closeMenu}>Blog</a></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
