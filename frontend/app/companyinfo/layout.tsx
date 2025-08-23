import Layout from "@/components/company/infolayout"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Layout headertitle='USER'>
      {children}
    </Layout>
  )
}
