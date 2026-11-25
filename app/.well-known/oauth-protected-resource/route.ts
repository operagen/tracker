export const dynamic = "force-dynamic";

// Tells MCP clients (claude.ai) where to sign in: Supabase's OAuth server.
export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return Response.json({
    resource: `${origin}/mcp`,
    authorization_servers: [`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`],
    bearer_methods_supported: ["header"],
  });
}
