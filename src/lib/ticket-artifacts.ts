import bwipjs from "bwip-js";
import QRCode from "qrcode";

export async function buildQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
  });
}

export async function buildBarcodeBuffer(payload: string) {
  return bwipjs.toBuffer({
    bcid: "code128",
    text: payload,
    scale: 3,
    height: 10,
    includetext: false,
    backgroundcolor: "FFFFFF",
  });
}
