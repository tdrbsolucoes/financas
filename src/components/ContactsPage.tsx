interface ContactsPageProps {
  user: User
  onDatabaseError?: (error: any) => void
}

const ContactsPage: React.FC<ContactsPageProps> = ({ user, onDatabaseError }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setContacts(data || [])
      } catch (error: any) {
        if (onDatabaseError) {
          onDatabaseError(error)
          return
        }
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [user.id, onDatabaseError])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Contacts</h1>
      {contacts.map(contact => (
        <div key={contact.id}>
          {contact.name} - {contact.email}
        </div>
      ))}
    </div>
  )
}