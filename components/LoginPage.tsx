import React, { useState } from 'react'
import { authService } from '../src/lib/supabase'

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await authService.signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await authService.signUp(email, password)
        if (error) throw error
        
        if (!error) {
          setError('Conta criada com sucesso! Faça login para continuar.')
          setIsLogin(true)
        }
      }
    } catch (error: any) {
      setError(error.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen grid place-items-center bg-background">
      <div className="w-full max-w-md p-10 bg-card border border-border rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="text-2xl bg-primary text-primary-foreground rounded-lg w-10 h-10 grid place-items-center font-bold">F</div>
          <h1>Finanças</h1>
        </div>
        
        <h2 className="text-center text-xl mb-8 text-muted-foreground">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
        
        {error && (
          <div className="bg-destructive/20 text-destructive p-3 rounded-lg mb-4 text-center text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="email" className="font-medium text-sm text-muted-foreground">Email</label>
            <input
              id="email"
              type="email"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex flex-col gap-2 mb-6">
            <label htmlFor="password" className="font-medium text-sm text-muted-foreground">Senha</label>
            <input
              id="password"
              type="password"
              className="w-full p-3 border border-border bg-input text-foreground rounded-lg text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full p-3 border-none rounded-lg bg-primary text-primary-foreground text-base font-semibold cursor-pointer transition-all hover:brightness-110 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>
        
        <div className="flex items-center text-center my-6 text-muted-foreground before:content-[''] before:flex-1 before:border-b before:border-border before:mr-2 after:content-[''] after:flex-1 after:border-b after:border-border after:ml-2">
          ou
        </div>
        
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="w-full p-3 border border-border rounded-lg bg-card text-foreground text-base font-semibold cursor-pointer transition-all hover:bg-accent flex items-center justify-center gap-3"
          disabled={loading}
        >
          {isLogin ? 'Criar nova conta' : 'Já tenho uma conta'}
        </button>
      </div>
    </div>
  )
}

export default LoginPage