import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Mail, Lock } from 'lucide-react';
import { loginUser } from '../api/auth';
import { setCredentials } from '../redux/authSlice';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await loginUser(data);
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-3xl mb-1">Welcome back</h1>
      <p className="text-ink-500 mb-8 text-sm">Log in to continue to NearStay.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={Mail}
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          type="password"
          icon={Lock}
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />

        {serverError && <p className="text-sm text-danger-500">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="text-sm text-ink-500 mt-6 text-center">
        Don't have an account?{' '}
        <Link to="/register" className="text-teal-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>
      <div className="flex justify-end">
  <Link to="/forgot-password" className="text-sm text-teal-600 hover:underline">
    Forgot password?
  </Link>
</div>
    </div>
    
  );
};

export default Login;
