import bannerPhoto from '../../assets/banner_photo.jpg'
import SocialLinks from './SocialLinks'
import '../css/banner.css'

function Banner() {
  return (
    <section className="banner" id="banner">
      <div className="banner-content">
        <div className="banner-image-container">
          <img src={bannerPhoto} alt="Louie Ormston Demi" className="banner-image" />
        </div>
        <div className="banner-text">
          <h1 className="banner-name">Louie Ormston Demi</h1>
          <SocialLinks />
          <p className="banner-title">Software | DevOps | Cloud Engineer</p>
          <p className="banner-experience">4+ Years of Experience</p>
        </div>
      </div>
    </section>
  )
}

export default Banner
