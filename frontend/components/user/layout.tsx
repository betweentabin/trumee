import Leftpage from "./page"
import Footer from "./footer"
import Header from "./header"
import Headertitle from "./headertitle"

export default function Layout({
  children
}: {
  children: React.ReactNode, headertitle: string
}) {
  return (
    <div>
      <Header />
      <Headertitle />
      <div className='bg-white p-9'>
        <div className="max-w-[1440px] w-full mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: sticky on desktop */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
              <Leftpage />
            </aside>
            {/* Right */}
            <main className="lg:col-span-9">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
