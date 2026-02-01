import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/experience.css'
import legalAndGeneralLogo from '../../assets/legal_and_general_logo.png'
import vodafoneLogo from '../../assets/vodafone_logo.png'
import phlashwebLogo from '../../assets/phlashweb_logo.png'
import cv from '../../assets/Louie Ormston Demi CV.pdf'

function Experience() {
  const [expandedItems, setExpandedItems] = useState([])

  const toggleExpand = (index) => {
    setExpandedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const experiences = [
    {
      company: 'Legal & General',
      logo: legalAndGeneralLogo,
      department: 'AWS Cloud',
      role: 'Cloud Engineer',
      type: 'Full Time',
      period: 'Nov 2024 – Present',
      responsibilities: [
        'Accelerated AWS regional enablement across the organisation through tooling migration, code optimisation, and architectural improvements',
        'Increased release frequency by automating standard changes, reducing complexity and freeing up developer time',
        'Onboarded and mentored new team members, embedding best practices across the team',
        'Maintained and enhanced existing cloud infrastructure'
      ]
    },
    {
      company: 'Vodafone',
      logo: vodafoneLogo,
      department: 'Retail and Logistics',
      role: 'Software Engineer',
      type: 'Full Time',
      period: 'Sep 2023 – Nov 2024',
      responsibilities: [
        'Designed and built a replenishment forecasting portal for nationwide stores using Python, React, AWS, and machine learning',
        'Researched and prototyped a computer vision solution for barcode scanning in distribution centres'
      ]
    },
    {
      company: 'Vodafone',
      logo: vodafoneLogo,
      department: 'Cloud Engineering',
      role: 'Junior SRE',
      type: 'Full Time',
      period: 'Sep 2022 – Sep 2023',
      responsibilities: [
        'Migrated integrated Slack commands to a multi-tenant web portal',
        'Built modular, end-to-end code templates (infrastructure, database, application scaffolding) for a custom templating engine, enabling rapid tenant onboarding',
        'Worked across Azure, AWS, GitHub, Terraform, and Python'
      ]
    },
    {
      company: 'Phlashweb',
      logo: phlashwebLogo,
      role: 'Software Developer',
      type: 'Full Time',
      period: 'Mar 2020 – Sep 2021',
      responsibilities: [
        'Maintained and updated client software solutions, primarily in .NET and WordPress',
        'Liaised directly with clients to gather requirements and manage expectations'
      ]
    }
  ]

  return (
    <section id="experience" className="experience">
      <div className="experience-container">
        <h2 className="experience-title">Experience</h2>
        <p className="experience-subtitle">My professional journey in software engineering and cloud infrastructure</p>

        <div className="timeline">
          {experiences.slice(0, 3).map((exp, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="content-with-logo">
                  {exp.logo && <img src={exp.logo} alt={`${exp.company} logo`} className="company-logo" />}
                  <div className="content-details">
                    <div className="experience-header">
                      <div className="company-details">
                        <h3 className="company-name">{exp.company}</h3>
                        {exp.department && <p className="department">{exp.department}</p>}
                      </div>
                      <span className="period">{exp.period}</span>
                    </div>
                    <div className="role-info">
                      <span className="role">{exp.role}</span>
                      <span className="type-badge">{exp.type}</span>
                    </div>
                    <button
                      className="expand-button"
                      onClick={() => toggleExpand(index)}
                      aria-expanded={expandedItems.includes(index)}
                    >
                      {expandedItems.includes(index) ? 'Hide Details' : 'Show Details'}
                      <span className={`chevron ${expandedItems.includes(index) ? 'open' : ''}`}>▼</span>
                    </button>
                    <div className={`responsibilities-container ${expandedItems.includes(index) ? 'expanded' : ''}`}>
                      <ul className="responsibilities">
                        {exp.responsibilities.map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="experience-buttons">
          <Link to="/experience" className="view-all-button">
            View All Experience →
          </Link>
          <a href={cv} download="Louie_Ormston_Demi_CV.pdf" className="view-all-button">
            Download CV →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Experience
