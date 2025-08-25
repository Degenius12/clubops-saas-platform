import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      setUser({ id: 1, email: 'admin@clubops.com', name: 'Club Manager' });
      setIsLoading(false);
    }, 1000);
  }, []);

  return {
    user,
    isLoading,
    setUser
  };
}