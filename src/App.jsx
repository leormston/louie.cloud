import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/jsx/Navbar'
import Banner from './components/jsx/banner'
import Experience from './components/jsx/experience'
import Testimonials from './components/jsx/testimonials'
import Contact from './components/jsx/contact'
import Blog from './components/jsx/blog'
import Footer from './components/jsx/Footer'
import BlogList from './pages/BlogList'
import TestimonialsList from './pages/TestimonialsList'

function Home() {
  return (
    <div className="content">
      <Banner />
      <Experience />
      <Testimonials />
      <Blog />
      <Contact />
    </div>
  )
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/testimonials" element={<TestimonialsList />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
