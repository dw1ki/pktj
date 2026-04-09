import PropTypes from 'prop-types'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen w-screen bg-[#f7f7f7]">
      <Sidebar />
      <div className="flex-1 ml-[320px] flex flex-col h-full">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#f7f7f7]">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}
