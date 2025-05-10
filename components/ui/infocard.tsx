import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, Info } from 'lucide-react';
import { Button } from './button';
import Link from 'next/link';

export default function InfoCard() {
  return (
    <div className="flex flex-col gap-6 mx-6 mt-5">
      {/* Card Tujuan */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <Youtube className="text-red-500" />
          <CardTitle className="text-xl">Tujuan Website</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Website ini dibuat untuk membantu pengguna menghapus komentar yang tidak diinginkan di video YouTube mereka. Fitur ini memungkinkan kamu untuk menyaring komentar berdasarkan kata kunci tertentu, lalu menghapusnya langsung dengan cepat dan aman.
          </p>
        </CardContent>
      </Card>

      {/* Card Info */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <Info className="text-blue-500" />
          <CardTitle className="text-xl">Hal yang Perlu Diketahui</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-base md:text-lg text-muted-foreground space-y-3 leading-relaxed">
            <li>🔐 Aplikasi ini menggunakan autentikasi resmi dari Google (OAuth2).</li>
            <li>📁 Tidak ada data pribadi yang disimpan di server kami.</li>
            <li>⚙️ Semua aksi penghapusan dilakukan langsung melalui API YouTube, dengan izin dari akun kamu.</li>
            <li>📌 Gunakan fitur ini dengan bijak sesuai dengan kebijakan komunitas YouTube.</li>
          </ul>
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <Link href="/youtube">
          <Button size="lg" className="text-lg px-6 py-4">
            🚀 Mulai Sekarang
          </Button>
        </Link>
      </div>
    </div>
  );
}
