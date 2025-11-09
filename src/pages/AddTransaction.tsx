import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddTransactionRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/transactions?nova=1', { replace: true });
  }, [navigate]);

  return null;
}
