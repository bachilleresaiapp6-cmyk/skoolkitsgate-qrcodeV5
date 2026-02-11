import { QrScanner } from "@/components/qr-scanner";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function ScannerPage() {
  return (
    <main className="h-screen w-screen bg-black text-white">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <QrScanner />
      </Suspense>
    </main>
  );
}
