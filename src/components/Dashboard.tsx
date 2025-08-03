@@ .. @@
 interface DashboardProps {
   user: User
+  onDatabaseError?: (error: any) => void
 }

-const Dashboard: React.FC<DashboardProps> = ({ user }) => {
+const Dashboard: React.FC<DashboardProps> = ({ user, onDatabaseError }) => {
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
      setLoading(false)
    }
  }