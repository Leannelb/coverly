import { Navigate } from 'react-router-dom';
import { useStore } from '../../app/store';

export default function AppIndex() {
  const { state } = useStore();
  return <Navigate to={state.policy ? '/home' : '/onboarding'} replace />;
}
