@@ .. @@
 interface ReportsPageProps {
   user: User
+  onDatabaseError?: (error: any) => void
 }

-const ReportsPage: React.FC<ReportsPageProps> = ({ user }) => {
+const ReportsPage: React.FC<ReportsPageProps> = ({ user, onDatabaseError }) => {
   const [transactions, setTransactions] = useState<Transaction[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
@@ .. @@
       setTransactions(data || [])
     } catch (error: any) {
+      if (onDatabaseError) {
+        onDatabaseError(error)
+        return
+      }
       setError(error.message)
     } finally {