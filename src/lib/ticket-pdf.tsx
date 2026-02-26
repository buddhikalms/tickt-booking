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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#f8fafc",
    fontSize: 11,
  },
  card: {
    borderRadius: 16,
    border: "1 solid #e2e8f0",
    backgroundColor: "#ffffff",
    padding: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },
  subtitle: {
    color: "#475569",
    marginTop: 3,
  },
  code: {
    marginTop: 10,
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 700,
  },
  bodyRow: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
  },
  qr: {
    width: 120,
    height: 120,
  },
  meta: {
    flexDirection: "column",
    gap: 5,
    flexGrow: 1,
  },
  label: {
    fontSize: 10,
    color: "#64748b",
  },
  value: {
    fontSize: 12,
    color: "#0f172a",
  },
  barcode: {
    marginTop: 14,
    width: 280,
    height: 56,
  },
});

function TicketDocument({ tickets }: { tickets: TicketPdfItem[] }) {
  return (
    <Document>
      {tickets.map((ticket) => (
        <Page key={ticket.ticketCode} size="A4" style={styles.page}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.title}>{ticket.eventTitle}</Text>
                <Text style={styles.subtitle}>{ticket.eventVenue}</Text>
                <Text style={styles.subtitle}>{ticket.eventAddress}</Text>
              </View>
              <View>
                <Text style={styles.label}>Ticket Type</Text>
                <Text style={styles.value}>{ticket.ticketType}</Text>
                <Text style={styles.code}>{ticket.ticketCode}</Text>
              </View>
            </View>
            <View style={styles.bodyRow}>
              <Image src={ticket.qrDataUrl} style={styles.qr} />
              <View style={styles.meta}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{ticket.eventDate}</Text>
                <Text style={styles.label}>Buyer</Text>
                <Text style={styles.value}>{ticket.buyerEmail}</Text>
              </View>
            </View>
            <Image src={`data:image/png;base64,${ticket.barcodePng.toString("base64")}`} style={styles.barcode} />
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
