import { AgentGenStudioWorkbench } from "../agentStudio/AgentGenStudioWorkbench.jsx";
import { listingStudio, defaultListingToolId, findListingTool } from "./listingStudioConfig.js";

export function ListingStudioWorkbench({ user }) {
  return (
    <AgentGenStudioWorkbench
      studio={listingStudio}
      defaultToolId={defaultListingToolId()}
      findTool={findListingTool}
      user={user}
    />
  );
}
