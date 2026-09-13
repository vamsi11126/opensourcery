import test from 'node:test';
import assert from 'node:assert/strict';
import { getListedProjectsCount, type ProjectCountClient } from '../src/lib/projects';

test('getListedProjectsCount returns approved projects count when approved > 0', async () => {
  const mockClient: ProjectCountClient = {
    project: {
      count: async (args) => {
        if (args?.where?.status === 'APPROVED') {
          return 42;
        }
        return 100;
      },
    },
  };

  const count = await getListedProjectsCount(mockClient);
  assert.equal(count, 42);
});

test('getListedProjectsCount falls back to total count when approved is 0', async () => {
  const mockClient: ProjectCountClient = {
    project: {
      count: async (args) => {
        if (args?.where?.status === 'APPROVED') {
          return 0;
        }
        return 15;
      },
    },
  };

  const count = await getListedProjectsCount(mockClient);
  assert.equal(count, 15);
});

test('getListedProjectsCount returns 0 if both counts are 0', async () => {
  const mockClient: ProjectCountClient = {
    project: {
      count: async () => 0,
    },
  };

  const count = await getListedProjectsCount(mockClient);
  assert.equal(count, 0);
});

test('getListedProjectsCount catches database errors and safely returns 0', async () => {
  const mockClient: ProjectCountClient = {
    project: {
      count: async () => {
        throw new Error('Database connection failed');
      },
    },
  };

  const count = await getListedProjectsCount(mockClient);
  assert.equal(count, 0);
});
