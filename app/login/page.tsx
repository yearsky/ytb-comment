import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { signIn } from '@/lib/auth';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-6 gap-6 bg-muted/40">
      
      {/* Card Login */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Masuk dengan akun Google kamu untuk mengelola komentar di YouTube.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <form
            action={async () => {
              'use server';
              await signIn('google', {
                redirectTo: '/youtube'
              });
            }}
            className="w-full"
          >
            <Button className="w-full">🔐 Sign in with Google</Button>
          </form>

          <Link href="/">
            <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Card Informasi Privasi */}
      <Card className="w-full max-w-sm">
        <CardHeader className="flex items-center gap-2">
          <ShieldCheck className="text-green-600" />
          <CardTitle className="text-xl">Privasi & Keamanan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground text-base space-y-2 leading-relaxed">
            <li>✅ Autentikasi dilakukan langsung melalui OAuth2 Google.</li>
            <li>🧾 Kami tidak menyimpan data pribadi atau akses login kamu.</li>
            <li>🛡️ Semua tindakan dilakukan secara langsung lewat API YouTube dengan izin kamu.</li>
            <li>📌 Kamu bisa membatalkan akses kapan saja dari pengaturan akun Google-mu.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
