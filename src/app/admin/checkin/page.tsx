"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CameraState = "idle" | "requesting" | "active" | "paused" | "blocked" | "error";

function getCameraSupportIssue() {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext) {
    return "Camera requires HTTPS (or localhost). If using phone on LAN IP, open over HTTPS tunnel.";
  }
  if (!navigator.mediaDevices) {
    return "Media devices API is unavailable in this browser.";
  }
  if (!navigator.mediaDevices.getUserMedia) {
    return "Camera API (getUserMedia) is unavailable on this browser/device.";
  }
  return null;
}

export default function AdminCheckInPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [isImageScanning, setIsImageScanning] = useState(false);
  const [imageScanMessage, setImageScanMessage] = useState("");
  const [cameraMessage, setCameraMessage] = useState(
    "Tap \"Allow Camera\" and approve permission in your browser to start scanning.",
  );

  const submit = useCallback(async (rawCode: string) => {
    const response = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: rawCode }),
    });
    const payload = (await response.json()) as { ok: boolean; message: string };
    setResult(payload);
  }, []);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraState("paused");
    setCameraMessage("Camera stopped. Tap \"Allow Camera\" to scan another ticket.");
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    const supportIssue = getCameraSupportIssue();
    if (supportIssue) {
      setCameraState("error");
      setCameraMessage(supportIssue);
      return;
    }

    setCameraState("requesting");
    setCameraMessage("Requesting camera permission...");
    try {
      const preflightStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      preflightStream.getTracks().forEach((track) => track.stop());

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices.length) {
        setCameraState("error");
        setCameraMessage("No camera device found.");
        return;
      }

      const preferred = devices.find((device) => /back|rear|environment/i.test(device.label));
      const deviceId = preferred?.deviceId ?? devices[0].deviceId;

      const reader = readerRef.current ?? new BrowserMultiFormatReader();
      readerRef.current = reader;
      controlsRef.current?.stop();
      controlsRef.current = await reader.decodeFromVideoDevice(deviceId, videoRef.current, async (decoded) => {
        if (!decoded) return;
        const scannedCode = decoded.getText();
        setCode(scannedCode);
        stopCamera();
        await submit(scannedCode);
      });
      setCameraState("active");
      setCameraMessage("Camera active. Point at QR code to scan.");
    } catch (error) {
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String((error as { name?: string }).name)
          : "UnknownError";
      if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        setCameraState("blocked");
        setCameraMessage(
          "Camera permission denied. Use browser site settings and allow camera for this site, then tap \"Allow Camera\".",
        );
        return;
      }
      if (errorName === "NotReadableError" || errorName === "TrackStartError") {
        setCameraState("error");
        setCameraMessage("Camera is busy in another app/tab. Close other camera apps and try again.");
        return;
      }
      if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        setCameraState("error");
        setCameraMessage("No available camera was found on this device.");
        return;
      }
      if (errorName === "SecurityError") {
        setCameraState("error");
        setCameraMessage("Blocked by browser security. Use HTTPS or localhost for camera access.");
        return;
      }
      setCameraState("error");
      setCameraMessage("Unable to start camera. Please retry.");
    }
  }, [stopCamera, submit]);

  const scanFromImage = useCallback(
    async (file: File) => {
      setIsImageScanning(true);
      setImageScanMessage("Scanning selected image...");
      let objectUrl = "";
      try {
        objectUrl = URL.createObjectURL(file);
        const reader = readerRef.current ?? new BrowserMultiFormatReader();
        readerRef.current = reader;
        const decodeResult = await reader.decodeFromImageUrl(objectUrl);
        const scannedCode = decodeResult.getText();
        setCode(scannedCode);
        setImageScanMessage("Code detected from image.");
        await submit(scannedCode);
      } catch {
        setImageScanMessage("Could not detect a valid QR/barcode in this image.");
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        setIsImageScanning(false);
      }
    },
    [submit],
  );

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Check-in Scanner</h1>
      <Card>
        <CardHeader>
          <CardTitle>Scan QR or Enter Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <video ref={videoRef} className="w-full rounded-lg border border-slate-200 dark:border-slate-800" />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="font-medium">Camera Access</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{cameraMessage}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={startCamera}
                disabled={cameraState === "requesting"}
              >
                {cameraState === "requesting" ? "Requesting..." : "Allow Camera"}
              </Button>
              {cameraState === "active" ? (
                <Button type="button" variant="outline" onClick={stopCamera}>
                  Stop Camera
                </Button>
              ) : null}
            </div>
            {(cameraState === "error" || cameraState === "blocked") ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500 dark:text-slate-400">
                <li>On mobile, camera works only on `https://...` (or localhost).</li>
                <li>If permission was denied, enable camera in browser site settings.</li>
                <li>You can upload a QR/barcode image below as a fallback.</li>
              </ul>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="font-medium">Scan from Image (Fallback)</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Upload a screenshot/photo containing the QR or barcode.
            </p>
            <div className="mt-3">
              <Input
                type="file"
                accept="image/*"
                disabled={isImageScanning}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  await scanFromImage(file);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            {imageScanMessage ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{imageScanMessage}</p>
            ) : null}
          </div>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await submit(code.trim());
            }}
          >
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter ticket code or ticket ID" />
            <Button type="submit">Validate</Button>
          </form>
          {result ? (
            <div className={`rounded-md p-3 text-sm ${result.ok ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200"}`}>
              {result.message}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
