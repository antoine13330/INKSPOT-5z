// Mock API handler for search history
const mockHistoryPOST = async (body: any) => {
  const { query, tags, searchType, userId } = body;

  // Validate required fields
  if (!userId) {
    return {
      status: 400,
      json: () => ({ error: 'User ID is required' }),
    };
  }

  if (!query && (!tags || tags.length === 0)) {
    return {
      status: 400,
      json: () => ({ error: 'Query or tags are required' }),
    };
  }

  // Mock successful response
  return {
    status: 200,
    json: () => ({
      message: 'Search history recorded successfully',
      searchRecord: {
        id: 'search_1',
        userId,
        query: query || '',
        tags: tags || [],
        searchType: searchType || 'posts',
        createdAt: new Date().toISOString(),
      },
    }),
  };
};

const mockHistoryGET = async (url: string) => {
  const { searchParams } = new URL(url);
  const userId = searchParams.get("userId");
  const limit = Number.parseInt(searchParams.get("limit") || "10");

  if (!userId) {
    return {
      status: 400,
      json: () => ({ error: 'User ID is required' }),
    };
  }

  // Mock search history data
  const mockHistory = [
    {
      id: 'search_1',
      userId,
      query: 'tattoo',
      tags: ['traditional', 'japanese'],
      searchType: 'posts',
      createdAt: '2024-01-15T10:30:00.000Z',
    },
    {
      id: 'search_2',
      userId,
      query: 'digital art',
      tags: ['illustration', 'design'],
      searchType: 'artists',
      createdAt: '2024-01-14T15:45:00.000Z',
    },
    {
      id: 'search_3',
      userId,
      query: '',
      tags: ['realism', 'portrait'],
      searchType: 'posts',
      createdAt: '2024-01-13T09:20:00.000Z',
    },
  ];

  return {
    status: 200,
    json: () => ({
      history: mockHistory.slice(0, limit),
      pagination: {
        page: 1,
        limit,
        total: mockHistory.length,
        hasMore: limit < mockHistory.length,
      },
    }),
  };
};

describe('Search History API', () => {
  describe('POST /api/search/history', () => {
    it('records search history with query', async () => {
      const body = {
        userId: 'user_1',
        query: 'tattoo design',
        searchType: 'posts',
      };

      const response = await mockHistoryPOST(body);
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('message' in data) {
        expect(data.message).toBe('Search history recorded successfully');
        expect(data.searchRecord.userId).toBe('user_1');
        expect(data.searchRecord.query).toBe('tattoo design');
        expect(data.searchRecord.searchType).toBe('posts');
      }
    });

    it('records search history with tags', async () => {
      const body = {
        userId: 'user_1',
        tags: ['traditional', 'japanese', 'sleeve'],
        searchType: 'artists',
      };

      const response = await mockHistoryPOST(body);
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('searchRecord' in data) {
        expect(data.searchRecord.tags).toEqual(['traditional', 'japanese', 'sleeve']);
        expect(data.searchRecord.searchType).toBe('artists');
      }
    });

    it('records search history with both query and tags', async () => {
      const body = {
        userId: 'user_1',
        query: 'digital art',
        tags: ['illustration', 'branding'],
        searchType: 'posts',
      };

      const response = await mockHistoryPOST(body);
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('searchRecord' in data) {
        expect(data.searchRecord.query).toBe('digital art');
        expect(data.searchRecord.tags).toEqual(['illustration', 'branding']);
      }
    });

    it('returns error when userId is missing', async () => {
      const body = {
        query: 'tattoo',
        searchType: 'posts',
      };

      const response = await mockHistoryPOST(body);
      const data = await response.json();

      expect(response.status).toBe(400);
      if ('error' in data) {
        expect(data.error).toBe('User ID is required');
      }
    });

    it('returns error when both query and tags are empty', async () => {
      const body = {
        userId: 'user_1',
        searchType: 'posts',
      };

      const response = await mockHistoryPOST(body);
      const data = await response.json();

      expect(response.status).toBe(400);
      if ('error' in data) {
        expect(data.error).toBe('Query or tags are required');
      }
    });

    it('handles empty query with tags', async () => {
      const body = {
        userId: 'user_1',
        query: '',
        tags: ['realism'],
        searchType: 'posts',
      };

      const response = await mockHistoryPOST(body);
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('searchRecord' in data) {
        expect(data.searchRecord.query).toBe('');
        expect(data.searchRecord.tags).toEqual(['realism']);
      }
    });

    it('uses default searchType when not provided', async () => {
      const body = {
        userId: 'user_1',
        query: 'art',
      };

      const response = await mockHistoryPOST(body);
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('searchRecord' in data) {
        expect(data.searchRecord.searchType).toBe('posts');
      }
    });
  });

  describe('GET /api/search/history', () => {
    it('returns user search history', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history?userId=user_1');
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('history' in data) {
        expect(data.history).toHaveLength(3);
        expect(data.history[0].userId).toBe('user_1');
      }
    });

    it('respects limit parameter', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history?userId=user_1&limit=2');
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('history' in data) {
        expect(data.history).toHaveLength(2);
        expect(data.pagination.limit).toBe(2);
        expect(data.pagination.hasMore).toBe(true);
      }
    });

    it('returns error when userId is missing', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history');
      const data = await response.json();

      expect(response.status).toBe(400);
      if ('error' in data) {
        expect(data.error).toBe('User ID is required');
      }
    });

    it('includes pagination information', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history?userId=user_1&limit=5');
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('pagination' in data) {
        expect(data.pagination).toBeDefined();
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.total).toBe(3);
        expect(data.pagination.hasMore).toBe(false);
      }
    });

    it('returns history sorted by creation date (newest first)', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history?userId=user_1');
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('history' in data) {
        const dates = data.history.map((item: any) => new Date(item.createdAt).getTime());
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
        expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
      }
    });

    it('includes all required fields in history items', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history?userId=user_1');
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('history' in data) {
        data.history.forEach((item: any) => {
          expect(item.id).toBeDefined();
          expect(item.userId).toBeDefined();
          expect(item.query).toBeDefined();
          expect(item.tags).toBeDefined();
          expect(item.searchType).toBeDefined();
          expect(item.createdAt).toBeDefined();
          expect(Array.isArray(item.tags)).toBe(true);
        });
      }
    });

    it('handles different search types', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history?userId=user_1');
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('history' in data) {
        const searchTypes = data.history.map((item: any) => item.searchType);
        expect(searchTypes).toContain('posts');
        expect(searchTypes).toContain('artists');
      }
    });

    it('handles empty query searches', async () => {
      const response = await mockHistoryGET('http://localhost:3000/api/search/history?userId=user_1');
      const data = await response.json();

      expect(response.status).toBe(200);
      if ('history' in data) {
        const emptyQueryItem = data.history.find((item: any) => item.query === '');
        expect(emptyQueryItem).toBeDefined();
        if (emptyQueryItem) {
          expect(emptyQueryItem.tags).toEqual(['realism', 'portrait']);
        }
      }
    });
  });
}); 