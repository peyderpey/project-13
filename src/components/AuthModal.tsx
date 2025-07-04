import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin'
}) => {
  const { t } = useTranslation();
  const { signIn, signUp, resetPassword, loading, error } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setMessage(t('auth.errors.passwordMismatch'));
      return;
    }

    if (mode === 'reset') {
      const { error } = await resetPassword(email);
      if (error) {
        setMessage(error);
      } else {
        setMessage(t('auth.resetEmailSent'));
      }
      return;
    }

    const { data, error } = mode === 'signin' 
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      setMessage(error);
    } else if (mode === 'signup') {
      setMessage(t('auth.signupSuccess'));
    } else {
      onClose();
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-md w-full border border-border shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'signin' && t('auth.signIn')}
            {mode === 'signup' && t('auth.signUp')}
            {mode === 'reset' && t('auth.resetPassword')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Confirm Password Field */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Error/Success Message */}
          {(message || error) && (
            <div className={`p-3 rounded-lg flex items-start space-x-2 ${
              message?.includes('sent') || message?.includes('success')
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
            }`}>
              {message?.includes('sent') || message?.includes('success') ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                message?.includes('sent') || message?.includes('success')
                  ? 'text-green-700 dark:text-green-200'
                  : 'text-red-700 dark:text-red-200'
              }`}>
                {message || error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <User className="w-5 h-5" />
                <span>
                  {mode === 'signin' && t('auth.signIn')}
                  {mode === 'signup' && t('auth.signUp')}
                  {mode === 'reset' && t('auth.sendResetEmail')}
                </span>
              </>
            )}
          </button>

          {/* Mode Switching */}
          <div className="text-center space-y-2">
            {mode === 'signin' && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('auth.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    {t('auth.signUp')}
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  {t('auth.forgotPassword')}
                </button>
              </>
            )}

            {mode === 'signup' && (
              <p className="text-sm text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {t('auth.signIn')}
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-primary hover:text-primary/80"
              >
                {t('auth.backToSignIn')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};