import Footer from "./footer"
import Header from "./header"

export default function Companylayout({
  children
}: {
  children: React.ReactNode, headertitle: string
}) {
  return (
    <div>
      <Header />
      <div className='bg-white flex'>
        <div className="w-full py-[100px]">
          {children}
        </div>  
      </div>
      <Footer />
    </div>
  )
}
