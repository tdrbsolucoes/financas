@@ .. @@
 interface ContactsPageProps {
   user: User
+  onDatabaseError?: (error: any) => void
 }

-const ContactsPage: React.FC<ContactsPageProps> = ({ user }) => {
+const ContactsPage: React.FC<ContactsPageProps> = ({ user, onDatabaseError }) => {
   const [contacts, setContacts] = useState<Contact[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
@@ .. @@
       setContacts(data || [])
     } catch (error: any) {
+      if (onDatabaseError) {
+        onDatabaseError(error)
+        return
+      }
       setError(error.message)
     } finally {