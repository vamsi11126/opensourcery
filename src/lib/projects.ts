import { db } from '@/lib/db';

export interface ProjectCountClient {
  project: {
    count: (args?: { where?: { status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'FLAGGED' } }) => Promise<number>;
  };
}

/**
 * Returns the number of open-source projects listed in the system.
 * Prioritizes approved projects, falling back to total projects if none are explicitly approved yet.
 */
export async function getListedProjectsCount(client: ProjectCountClient = db): Promise<number> {
  try {
    const approvedCount = await client.project.count({
      where: { status: 'APPROVED' },
    });
    if (approvedCount > 0) {
      return approvedCount;
    }
    return await client.project.count();
  } catch {
    return 0;
  }
}
