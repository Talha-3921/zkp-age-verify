# Threat Model

## Adversaries

A malicious user is an active adversary who may submit arbitrary proofs, tampered public signals, stale values, replayed proofs, malformed JSON, or proofs generated for another circuit. Their goal is to obtain a successful verification result despite not knowing a valid birth year that meets the minimum age constraint. They may also attempt to confuse the server with very large values, missing fields, or type-confusion data.

A malicious server is considered separately. The server receives the proof and public signals, while the birth year remains in the browser witness and should not be submitted to the backend. If the server is malicious or compromised, it might try to infer private information from request metadata, timing, proof structure, or the browser application itself. In this project, the stronger and more realistic assumption is an honest-but-curious server: it follows the verification protocol but may observe and analyze the data it receives.

## Trust Boundaries

The browser is the trust boundary that performs witness construction and proof generation. The private `birthYear` must remain in browser memory and must never be sent to the route handler. The proving key is also sensitive operationally and must not be treated as part of server-side public verification material. The public API boundary carries only `proof` and `publicSignals`, while the server trust boundary reads `keys/verification_key.json` and executes SnarkJS verification.

The honesty assumption means the server is trusted to return the verification result and protect the verification key, but it is not given the private birth year by the protocol. It is not protected from a genuinely malicious browser that lies about its code or from a user who separately discloses the birth year. It must also be protected from malicious replacement of the verification key, because a compromised key could alter or bypass the expected verification statement. Transport security such as HTTPS is therefore necessary between the browser and server.

## Security Guarantees

The Groth16 proof provides zero-knowledge with respect to the private witness. Assuming the circuit and trusted setup are sound, a server cannot derive `birthYear` from the proof alone, and birth year is not disclosed as a public signal. The proof demonstrates that there exists a valid witness satisfying the circuit constraints, including the age calculation and the checks that the birth year is sufficiently old and not in the future.

A malicious user cannot forge a valid proof for `age >= minAge` without having a witness that satisfies the circuit and producing it with the matching proving key. If they modify the proof or public signals, Groth16 verification should fail. A verification result does not, however, prove that the submitted birth year is authentic in the real world. A user could construct a valid proof from false data unless the system adds an external identity or credential trust mechanism. The backend also cannot prove that an accepted public signal came from the correct browser session without application-level authentication or binding.

## Replay Attacks

Suppose an older valid proof says that a person met the minimum age for 2024. An attacker could copy that proof and resend it in 2026 if the server did not check the public year or accepted proofs without freshness. This replay may incorrectly appear valid even though the user's current circumstances should be evaluated against the present year. The `currentYear` public signal mitigates this by binding the proof to the year used in witness generation and age calculation.

The server should compare the public `currentYear` with an expected server-side date or permitted window before accepting the proof, and it should avoid relying on proof verification alone. A replay of a proof generated with the wrong or stale year should be rejected by policy. This does not stop copying the same proof while `currentYear` still matches; additional nonce, session, expiry, or transaction binding can prevent credential or authorization replay. The circuit must remain consistent in representing and checking public signals.

## Side Channels

Timing differences can reveal whether malformed requests, missing keys, cryptographic parsing, and proof verification are being processed, although the route does not log or disclose the birth year. Verification itself should use constant-time cryptographic operations through the library, but the surrounding application can leak whether a request passed or failed. These accepted/rejected outcomes are operational information rather than the private witness and may still support abuse if endpoints are automated.

Other side channels include memory handling, browser extensions, malicious JavaScript, compromised devices, network metadata, and access to proof-generation logs. Proof size and public-signal size may reveal the circuit or public policy but should not reveal the birth year. The server should not cache or log private witness data, should maintain HTTPS, retain only necessary verification logs, and use rate limiting and monitoring to reduce probing. Trusted setup security, key protection, and routine dependency updates are also important because they protect the cryptographic and implementation assumptions behind this threat model.
