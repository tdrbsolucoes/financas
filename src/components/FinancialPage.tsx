@@ .. @@
 interface FinancialPageProps {
   user: User
+  onDatabaseError?: (error: any) => void
 }

-const FinancialPage: React.FC<FinancialPageProps> = ({ user }) => {
+const FinancialPage: React.FC<FinancialPageProps> = ({ user, onDatabaseError }) => {
   const [transactions, setTransactions] = useState<Transaction[]>([])
   const [contacts, setContacts] = useState<Contact[]>([])
   const [loading, setLoading] = useState(true)
@@ .. @@
       setTransactions(transactionsResult.data || [])
       setContacts(contactsResult.data || [])
     } catch (error: any) {
+      if (onDatabaseError) {
+        onDatabaseError(error)
+        return
+      }
       setError(error.message)
     } finally {