export interface PaginationQuery {
  page?: number;
  perPage?: number;
}

export const buildPagination = (query: PaginationQuery) => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const perPage = query.perPage && query.perPage > 0 ? Math.min(query.perPage, 100) : 20;
  const skip = (page - 1) * perPage;
  return { page, perPage, skip, take: perPage };
};
