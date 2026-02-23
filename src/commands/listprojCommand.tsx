import type { ReactNode } from 'react';
import StatusResponse from '@common/StatusResponse';
import Response from '@common/Response';
import Paragraph from '@base/Paragraph';
import { loadContent } from '@services/storageService';
import { parseTodos, getUniqueProjects } from '@services/todoService';

/**
 * Handles the 'listproj' command to list all unique +project tags.
 */
const listprojCommand = async (
  _args: string,
  pushToHistory: (content: ReactNode) => void
) => {
  try {
    const content = loadContent();
    const todos = parseTodos(content);
    const projects = getUniqueProjects(todos);

    if (projects.length === 0) {
      pushToHistory(
        <StatusResponse
          statusType="waiting"
          statusText="No projects found."
        />
      );
    } else {
      pushToHistory(
        <Response>
          {projects.map((proj, i) => (
            <Paragraph key={i} className="text-blue-400">
              {proj}
            </Paragraph>
          ))}
        </Response>
      );
    }
  } catch {
    pushToHistory(
      <StatusResponse
        statusType="error"
        statusText="Failed to list projects."
      />
    );
  }
};

export default listprojCommand;
