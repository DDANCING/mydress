import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  const synapseSecret = process.env.SYNAPSE_SECRET;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token de autorização é obrigatório", status: "error", code: 401 },
      { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const token = authorization.replace("Bearer ", "");

  if (!synapseSecret || token !== synapseSecret) {
    return NextResponse.json(
      { error: "Token de autorização inválido", status: "error", code: 403 },
      { status: 403, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  return NextResponse.json({
    message: "Synapse API Auth Check",
    status: "success",
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" }
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type"
    }
  });
}
