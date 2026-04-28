import { withWorkflow } from "workflow/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
}

// `withWorkflow` enables the `"use workflow"` and `"use step"` SWC
// directives, exposes the internal `/.well-known/workflow/*` routes the
// runtime needs, and bundles workflow files for both edge and node
// targets. Without this wrapper `start()` would fail with
// "received an invalid workflow function".
export default withWorkflow(nextConfig)
