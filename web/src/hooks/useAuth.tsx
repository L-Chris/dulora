import { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

type AuthStatus = 'loading' | 'authed' | 'anon';

interface AuthContextValue {
  status: AuthStatus;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: (password: string) => api.login(password),
    onSuccess: () => {
      queryClient.setQueryData(['me'], { id: 1 });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(['me'], null);
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      status: meQuery.isPending ? 'loading' : meQuery.data ? 'authed' : 'anon',
      login: async (password: string) => {
        await loginMutation.mutateAsync(password);
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meQuery.isPending, meQuery.data],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
