import { AgentGenStudioWorkbench } from "../agentStudio/AgentGenStudioWorkbench.jsx";
import { contentStudio, defaultContentToolId, findContentTool } from "./contentStudioConfig.js";

export function ContentStudioWorkbench({ user }) {
  return (
    <AgentGenStudioWorkbench
      studio={contentStudio}
      defaultToolId={defaultContentToolId()}
      findTool={findContentTool}
      user={user}
    />
  );
}
