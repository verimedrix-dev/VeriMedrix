import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Image
                src="/VeriMedrix Logo.png"
                alt="VeriMedrix"
                width={160}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} VeriMedrix. All rights reserved.
            </p>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-slate-600 hover:text-blue-600">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="text-slate-600 hover:text-blue-600">
                Privacy Policy
              </Link>
              <Link href="/refund" className="text-slate-600 hover:text-blue-600">
                Refund Policy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
