'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';

export function AdminLogin({ socket, onSuccess }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    socket.emit('admin-login', { login, password }, (res) => {
      setLoading(false);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Неверный логин или пароль');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
            QUIZZ Админ
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1" htmlFor="admin-login">Логин</label>
              <Input id="admin-login" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Введите логин" autoComplete="username" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1" htmlFor="admin-pass">Пароль</label>
              <Input type="password" id="admin-pass" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password" />
            </div>
            {error && <p className="text-danger text-sm text-center" role="alert">{error}</p>}
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
