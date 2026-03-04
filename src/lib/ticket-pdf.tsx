/* eslint-disable jsx-a11y/alt-text */
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

type TicketPdfItem = {
  ticketCode: string;
  eventTitle: string;
  eventVenue: string;
  eventAddress: string;
  eventDate: string;
  buyerEmail: string;
  ticketType: string;
  qrDataUrl: string;
  barcodePng: Buffer;
};

const PDF_TEMPLATE_NAME = "Sri Sambuddha Viharaya Tickets";

const styles = StyleSheet.create({
  page: {
    padding: 26,
    backgroundColor: "#f6efe4",
    fontSize: 11,
  },
  card: {
    borderRadius: 22,
    border: "1 solid #ead8bf",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: "#7c3f12",
  },
  heroLabel: {
    fontSize: 10,
    color: "#fde68a",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 700,
    color: "#ffffff",
  },
  heroSubTitle: {
    marginTop: 4,
    fontSize: 11,
    color: "#ffedd5",
  },
  section: {
    padding: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eventMeta: {
    flexGrow: 1,
    paddingRight: 16,
  },
  ticketMetaCard: {
    minWidth: 150,
    borderRadius: 14,
    border: "1 solid #ead8bf",
    backgroundColor: "#fff7ed",
    padding: 12,
  },
  code: {
    marginTop: 8,
    fontSize: 14,
    color: "#7c2d12",
    fontWeight: 700,
  },
  subCode: {
    marginTop: 3,
    fontSize: 10,
    color: "#9a3412",
  },
  bodyRow: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start",
    marginTop: 18,
  },
  qr: {
    width: 108,
    height: 108,
    borderRadius: 10,
    border: "1 solid #ead8bf",
  },
  meta: {
    flexDirection: "column",
    gap: 10,
    flexGrow: 1,
  },
  metaBlock: {
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    border: "1 solid #e2e8f0",
    padding: 10,
  },
  label: {
    fontSize: 10,
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 12,
    color: "#1f2937",
    marginTop: 3,
  },
  divider: {
    marginTop: 18,
    borderTop: "1 solid #ead8bf",
    paddingTop: 16,
  },
  barcodeLabel: {
    fontSize: 10,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  barcode: {
    marginTop: 10,
    width: 300,
    height: 56,
    alignSelf: "center",
  },
  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerNote: {
    maxWidth: 340,
    fontSize: 10,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  footerTemplate: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: 700,
  },
});

function TicketDocument({ tickets }: { tickets: TicketPdfItem[] }) {
  return (
    <Document>
      {tickets.map((ticket) => (
        <Page key={ticket.ticketCode} size="A4" style={styles.page}>
          <View style={styles.card}>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>{PDF_TEMPLATE_NAME}</Text>
              <Text style={styles.heroTitle}>{ticket.eventTitle}</Text>
              <Text style={styles.heroSubTitle}>{ticket.eventVenue}</Text>
              <Text style={styles.heroSubTitle}>{ticket.eventAddress}</Text>
            </View>
            <View style={styles.section}>
              <View style={styles.row}>
                <View style={styles.eventMeta}>
                  <Text style={styles.label}>Admit One</Text>
                  <Text style={styles.value}>{ticket.ticketType}</Text>
                  <Text style={styles.subCode}>Present this PDF at the check-in desk.</Text>
                </View>
                <View style={styles.ticketMetaCard}>
                  <Text style={styles.label}>Ticket Code</Text>
                  <Text style={styles.code}>{ticket.ticketCode}</Text>
                  <Text style={styles.subCode}>Keep this code for support or entry checks.</Text>
                </View>
              </View>

              <View style={styles.bodyRow}>
                <Image src={ticket.qrDataUrl} style={styles.qr} />
                <View style={styles.meta}>
                  <View style={styles.metaBlock}>
                    <Text style={styles.label}>Date & Time</Text>
                    <Text style={styles.value}>{ticket.eventDate}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.label}>Buyer Email</Text>
                    <Text style={styles.value}>{ticket.buyerEmail}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.label}>Venue</Text>
                    <Text style={styles.value}>{ticket.eventVenue}</Text>
                    <Text style={styles.value}>{ticket.eventAddress}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider}>
                <Text style={styles.barcodeLabel}>Primary Barcode</Text>
                <Image src={`data:image/png;base64,${ticket.barcodePng.toString("base64")}`} style={styles.barcode} />
                <View style={styles.footerRow}>
                  <Text style={styles.footerNote}>
                    Scan either the QR code or barcode at the event entrance. This ticket is valid for one admission only.
                  </Text>
                  <Text style={styles.footerTemplate}>{PDF_TEMPLATE_NAME}</Text>
                </View>
              </View>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}

async function nodeStreamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
      continue;
    }
    if (chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
      continue;
    }
    if (chunk instanceof ArrayBuffer) {
      chunks.push(Buffer.from(chunk));
      continue;
    }
    if (ArrayBuffer.isView(chunk)) {
      chunks.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      continue;
    }
    chunks.push(Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks);
}

export async function renderTicketsPdf(tickets: TicketPdfItem[]) {
  const out: unknown = await pdf(<TicketDocument tickets={tickets} />).toBuffer();
  if (Buffer.isBuffer(out)) {
    return out;
  }
  if (out instanceof Uint8Array) {
    return Buffer.from(out);
  }
  if (out instanceof ArrayBuffer) {
    return Buffer.from(out);
  }
  if (typeof Blob !== "undefined" && out instanceof Blob) {
    return Buffer.from(await out.arrayBuffer());
  }
  if (out instanceof Readable) {
    return nodeStreamToBuffer(out);
  }

  const maybeStream = out as { getReader?: () => unknown };
  if (typeof maybeStream.getReader === "function") {
    const response = new Response(out as BodyInit);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("Unsupported PDF buffer output type");
}

export type { TicketPdfItem };
