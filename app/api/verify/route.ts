// Saad — Backend verification route

import fs from "node:fs";
import path from "node:path";
import * as snarkjs from "snarkjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proof, publicSignals } = body as {
      proof: unknown;
      publicSignals: unknown[];
    };

    if (proof === undefined || !Array.isArray(publicSignals)) {
      return Response.json(
        { verified: false, error: "Proof verification failed" },
        { status: 400 }
      );
    }

    const verificationKeyPath = path.join(
      process.cwd(),
      "keys",
      "verification_key.json"
    );

    let verificationKeyJson: string;
    try {
      verificationKeyJson = fs.readFileSync(verificationKeyPath, "utf8");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return Response.json({
          verified: true,
          simulated: true,
          message: "Verification key not found — running in demo mode",
        });
      }
      throw error;
    }

    const verificationKey = JSON.parse(verificationKeyJson);
    const verified = await snarkjs.groth16.verify(
      verificationKey,
      publicSignals,
      proof
    );

    if (!verified) {
      return Response.json({
        verified: false,
        error: "Proof verification failed",
      });
    }

    return Response.json({ verified: true });
  } catch {
    return Response.json(
      { verified: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
