import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MessagingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/staff/okapia-connect', { replace: true });
  }, [navigate]);

  return null;
}
