export const canAccessBuyerResource = (
  authenticatedUserId: string,
  resourceUserId: string
): boolean => authenticatedUserId === resourceUserId;

export const getOwnedBuyerResourceWhere = (accountId: string, id: string) => ({
  accountId,
  id,
});
