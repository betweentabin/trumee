import Footer from "@/components/user/footer";
import Header from "@/components/user/header";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Header />
      <div className="bg-white">{children}</div>
      <Footer />
    </div>
  );
}

