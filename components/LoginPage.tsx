import React, { useState } from 'react'
import { authService } from '../supabaseClient'

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
        
        <h2>{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>
        
        <div className="divider">ou</div>
        
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="google-login-button"
          disabled={loading}
        >
          {isLogin ? 'Criar nova conta' : 'Já tenho uma conta'}
        </button>
      </div>
    </div>
  )
}

export default LoginPage