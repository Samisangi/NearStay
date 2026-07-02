import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import api from '../api/axiosInstance';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
        <Mail size={24} className="text-teal-600" />
      </div>
      <h1 className="text-2xl mb-2">Check your email</h1>
      <p className="text-ink-500 text-sm mb-6">
        If that email is registered, a reset link has been sent. Check your inbox and spam folder.
      </p>
      <Link to="/login" className="text-teal-600 text-sm font-medium hover:underline">
        Back to login
      </Link>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl mb-1">Forgot password</h1>
      <p className="text-ink-500 text-sm mb-8">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        {error && <p className="text-sm text-danger-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-sm text-ink-500 mt-6 text-center">
        Remember it?{' '}
        <Link to="/login" className="text-teal-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;