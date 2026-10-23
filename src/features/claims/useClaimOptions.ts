import { useQuery } from '@tanstack/react-query';
import { getClaimOptions } from '../../lib/api/endpoints';
import { useRequiredToken } from '../token/TokenProvider';

/** Min amount, fee and destinations for one asset. Shared cache key, so screens don't refetch. */
export function useClaimOptions(asset: string | undefined) {
  const token = useRequiredToken();
  return useQuery({
    queryKey: ['claim-options', asset],
    queryFn: ({ signal }) => getClaimOptions(token, asset!, signal),
    enabled: !!token && !!asset,
  });
}
