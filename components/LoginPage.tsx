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
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <div className="logo">F</div>
          <h1>Finanças</h1>
        </div>
        
        <h2 className="text-center text-xl mb-8 text-muted-foreground">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
        
        {error && (
          <div className="bg-destructive/20 text-destructive p-3 rounded-lg mb-4 text-center text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Senha</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="form-button"
            disabled={loading}
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>
        
        <div className="divider">
          ou
        </div>
        
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="form-button bg-card text-foreground border border-border hover:bg-accent hover:text-accent-foreground"
          disabled={loading}
        >
          {isLogin ? 'Criar nova conta' : 'Já tenho uma conta'}
        </button>
      </div>
    </div>
  )
}

export default LoginPage