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
  minLength: { value: 8, message: 'At least 8 characters' },
  validate: {
    hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
    hasNumber: (v) => /[0-9]/.test(v) || 'Must contain a number',
    hasSpecial: (v) => /[^A-Za-z0-9]/.test(v) || 'Must contain a special character',
  },
})}
        />
        {/* Add this right after the password Input in Register.jsx */}
{(() => {
  const pwd = watch('password') || '';
  const checks = [
    { label: '8+ characters', ok: pwd.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(pwd) },
    { label: 'Number', ok: /[0-9]/.test(pwd) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
  if (!pwd) return null;
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-danger-500', 'bg-warning-500', 'bg-warning-500', 'bg-teal-400', 'bg-teal-500'];
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-paper-300'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((c) => (
          <p key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-teal-600' : 'text-ink-400'}`}>
            <span>{c.ok ? '✓' : '○'}</span>{c.label}
          </p>
        ))}
      </div>
    </div>
  );
})()}

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
