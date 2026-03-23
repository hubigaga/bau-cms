import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 30 },
  title: { fontSize: 20, marginBottom: 4 },
  meta: { color: '#666', marginBottom: 2 },
  table: { marginTop: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingVertical: 4 },
  col3: { flex: 3 },
  col1: { flex: 1, textAlign: 'right' },
  totalSection: { marginTop: 16, alignItems: 'flex-end' },
  totalLine: { marginTop: 2 },
  grandTotal: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  notes: { marginTop: 24, color: '#666', fontSize: 9 },
})

export function InvoicePDF({ invoice }: { invoice: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {invoice.type === 'ANGEBOT' ? 'Angebot' : invoice.type === 'GUTSCHRIFT' ? 'Gutschrift' : 'Rechnung'}{' '}
            {invoice.number}
          </Text>
          <Text style={styles.meta}>
            Datum: {new Date(invoice.date).toLocaleDateString('de-DE')}
          </Text>
          {invoice.dueDate && (
            <Text style={styles.meta}>
              Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{invoice.customer?.name}</Text>
          {invoice.customer?.address && <Text style={styles.meta}>{invoice.customer.address}</Text>}
          {invoice.customer?.email && <Text style={styles.meta}>{invoice.customer.email}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col3}>Beschreibung</Text>
            <Text style={styles.col1}>Menge</Text>
            <Text style={styles.col1}>Einzelpreis</Text>
            <Text style={styles.col1}>Gesamt</Text>
          </View>
          {invoice.items?.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.col3}>{item.description}</Text>
              <Text style={styles.col1}>{item.quantity}</Text>
              <Text style={styles.col1}>{item.unitPrice.toFixed(2)} €</Text>
              <Text style={styles.col1}>{item.total.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <Text style={styles.totalLine}>Netto: {invoice.subtotal?.toFixed(2)} €</Text>
          <Text style={styles.totalLine}>
            MwSt. {invoice.vatRate}%: {invoice.vatAmount?.toFixed(2)} €
          </Text>
          <Text style={styles.grandTotal}>Gesamt: {invoice.total?.toFixed(2)} €</Text>
        </View>

        {invoice.notes && <Text style={styles.notes}>{invoice.notes}</Text>}
      </Page>
    </Document>
  )
}
