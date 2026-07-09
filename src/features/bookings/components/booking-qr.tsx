"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingQrProps {
  confirmationCode: string;
  bookingId: string;
}

export function BookingQr({ confirmationCode, bookingId }: BookingQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const payload = `PLAYHUB:${bookingId}:${confirmationCode}`;

  useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      try {
        const QRCode = await import("qrcode");
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, payload, {
          width: 180,
          margin: 2,
          color: { dark: "#0a0a0a", light: "#ffffff" },
        });
      } catch {
        // Fallback: canvas shows code text only
      }
    }

    void renderQr();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="text-base">Check-in QR</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <canvas ref={canvasRef} className="rounded-lg border bg-white p-2" />
        <p className="font-mono text-sm font-semibold tracking-widest">
          {confirmationCode}
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Present this code at venue check-in
        </p>
      </CardContent>
    </Card>
  );
}
