import { HomeHeader } from '@/components/home/home-header';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, BarChart3, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
              Quản lý quỹ phi tập trung
            </h1>
            <h2 className="text-2xl sm:text-3xl font-medium text-white/90 mb-6">
              Minh bạch và Hiệu quả
            </h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto mb-10">
              Nền tảng quản lý quỹ phi tập trung giúp tổ chức và cá nhân quản lý tài sản một cách minh bạch, hiệu quả và an toàn thông qua công nghệ blockchain.
            </p>
              <Button size="lg" variant="secondary" className="group hover:scale-105 transition-transform">
                Sẵn sàng bắt đầu ngay
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
          </div>
        </section>
        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 gradient-text">
              Tính năng nổi bật
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Shield className="h-10 w-10 text-primary" />}
                title="Bảo mật và Minh bạch"
                description="Dữ liệu được mã hóa và lưu trữ trên blockchain đảm bảo tính minh bạch và an toàn tuyệt đối."
              />
              <FeatureCard 
                icon={<BarChart3 className="h-10 w-10 text-[hsl(var(--chart-2))]" />}
                title="Quản lý Quỹ Thông minh"
                description="Theo dõi và quản lý quỹ một cách hiệu quả với các công cụ phân tích dữ liệu và bảng điều khiển trực quan."
              />
              <FeatureCard 
                icon={<Users className="h-10 w-10 text-[hsl(var(--chart-3))]" />}
                title="Quản trị Phi tập trung"
                description="Mọi quyết định đều thông qua biểu quyết công khai, đảm bảo quyền tự chủ của cộng đồng."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="gradient-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/80">
            © 2025 DanoFund. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="hover-card bg-white dark:bg-gray-800 p-8 rounded-xl border border-primary/10">
      <div className="mb-5">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}