# ZKP Age Verification Portal

A zero-knowledge age verification demo that proves a birth year meets a minimum age requirement without sending the birth year to the server.

- **GitHub repository:** https://github.com/Talha-3921/zkp-age-verify
- **Live demo:** see Vercel deployment link

## How to Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Circuit Compilation

The Circom source is in `circom/AgeVerify.circom`. After Circom and SnarkJS are installed, compile the circuit and run the trusted setup:

```bash
circom circom/AgeVerify.circom --r1cs --wasm --sym -o circuits

snarkjs powersoftau new bn128 14 circuits/pot14_0000.ptau -v
snarkjs powersoftau contribute circuits/pot14_0000.ptau circuits/pot14_0001.ptau --name="Trusted setup contribution" -v
snarkjs powersoftau prepare phase2 circuits/pot14_0001.ptau circuits/pot14_final.ptau -v

snarkjs groth16 setup circuits/AgeVerify.r1cs circuits/pot14_final.ptau circuits/AgeVerify.zkey
snarkjs zkey export verificationkey circuits/AgeVerify.zkey keys/verification_key.json
```

Place browser-facing witness files and the proving key where the frontend can load them. In demo mode, the application continues without compiled circuit artifacts.

## Team

| Member | Role | Contribution |
| --- | --- | --- |
| Wajid | Circuit engineer | Circom circuit design, range constraints, and LessThan age comparison |
| Saad | Backend engineer | Next.js API route, Groth16 verification, and threat model |
| Talha | Frontend engineer | Next.js UI, proof workflow, and verification presentation |

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Circuit language | Circom 2.0 |
| Circuit library | circomlib |
| Proof system | Groth16 |
| Proof tooling | SnarkJS |
| Deployment | Vercel |

## Project Structure

- `circom/AgeVerify.circom` - private-age Circom circuit
- `circuits/` - compiled R1CS, WASM, zkey, and setup artifacts
- `keys/verification_key.json` - public Groth16 verification key
- `app/api/verify/route.ts` - server-side proof verification route
- `app/page.tsx` - interactive frontend
- `REPORT.md` - technical and security report
