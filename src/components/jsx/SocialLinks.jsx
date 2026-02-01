import { FaGithub, FaLinkedin, FaTwitter, FaHackerrank } from 'react-icons/fa'
import '../css/SocialLinks.css'

function SocialLinks() {
  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/leormston',
      icon: FaGithub
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/louie-ormston-48810a150',
      icon: FaLinkedin
    },
    {
      name: 'Twitter',
      url: 'https://x.com/LouieOrmstonX',
      icon: FaTwitter
    },
    {
      name: 'HackerRank',
      url: 'https://www.hackerrank.com/louie11',
      icon: FaHackerrank
    }
  ]

  return (
    <div className="social-links">
      {socialLinks.map((link) => {
        const Icon = link.icon
        return (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            aria-label={link.name}
          >
            <Icon />
          </a>
        )
      })}
    </div>
  )
}

export default SocialLinks
