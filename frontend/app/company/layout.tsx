import Layout from "@/components/company/layout"

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
