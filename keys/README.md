# Groth16 Verification Key

After the trusted setup is completed, export the Groth16 verification key to this folder as:

```text
verification_key.json
```

The file is a public JSON representation of the proving system parameters needed to verify proofs for `AgeVerify.circom`. It contains the protocol and curve information, the alpha and beta G1/G2 points, the gamma G2 point, the delta G2 point, and the public-input scaling/point information (IC) used by SnarkJS or another compatible verifier.

The verification key is not secret and should be distributed to the Next.js server. The server loads `keys/verification_key.json` and passes it to `snarkjs.groth16.verify`, together with the public signals and the proof submitted by the browser. Verification succeeds only if the proof was generated with the matching circuit and proving key, and it lets the server confirm the age requirement without receiving the private `birthYear`.
