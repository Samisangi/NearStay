import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock } from 'lucide-react';
import api from '../api/axiosInstance';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
        <Lock size={24} className="text-teal-600" />
      </div>
      <h1 className="text-2xl mb-2">Password reset!</h1>
      <p className="text-ink-500 text-sm">Redirecting you to login...</p>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl mb-1">Set new password</h1>
      <p className="text-ink-500 text-sm mb-8">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          icon={Lock}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
            validate: {
              hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
              hasNumber: (v) => /[0-9]/.test(v) || 'Must contain a number',
              hasSpecial: (v) => /[^A-Za-z0-9]/.test(v) || 'Must contain a special character',
            },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          icon={Lock}
          error={errors.confirm?.message}
          {...register('confirm', {
            required: 'Please confirm your password',
            validate: (v) => v === watch('password') || 'Passwords do not match',
          })}
        />

        {error && <p className="text-sm text-danger-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;