import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Phone } from 'lucide-react';
import { registerUser } from '../api/auth';
import { setCredentials } from '../redux/authSlice';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { cn } from '../lib/cn';

const Register = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { role: 'seeker' },
  });
  const role = watch('role');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await registerUser(data);
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-3xl mb-1">Create your account</h1>
      <p className="text-ink-500 mb-8 text-sm">Find a room, or list one.</p>

      {/* Role toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-paper-200 rounded-control">
        {['seeker', 'owner'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setValue('role', r)}
            className={cn(
              'flex-1 py-2 rounded-control text-sm font-medium transition-colors',
              role === r ? 'bg-paper-50 text-teal-600 shadow-card' : 'text-ink-500'
            )}
          >
            {r === 'seeker' ? "I'm looking for a room" : "I'm listing a room"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          icon={User}
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />
        <Input
          label="Email"
          type="email"
          icon={Mail}
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Phone (optional)"
          icon={Phone}
          {...register('phone')}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'At least 6 characters' },
          })}
        />

        {serverError && <p className="text-sm text-danger-500">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-ink-500 mt-6 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-teal-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Register;
