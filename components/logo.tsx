import { QrCode } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
        <QrCode className="h-8 w-8" />
      </div>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold font-headline tracking-tight text-primary">
          QR GATE
        </h1>
        <p className="text-sm font-semibold text-muted-foreground -mt-1">SKOOL KITS</p>
      </div>
    </div>
  );
}
