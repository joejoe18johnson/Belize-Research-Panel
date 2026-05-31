/** Netlify sets CONTEXT to deploy-preview | branch-deploy | production | etc. */
export function isNetlifyDeployPreview(): boolean {
  const context = process.env.CONTEXT?.trim();
  return context === "deploy-preview" || context === "branch-deploy";
}

export function isNetlifyTestingSite(): boolean {
  return process.env.NETLIFY === "true" && isNetlifyDeployPreview();
}
