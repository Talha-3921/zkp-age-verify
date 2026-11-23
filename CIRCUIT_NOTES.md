# Circuit Design Notes

## Why Groth16 Was Chosen

Groth16 is a practical proving system for this project because it produces compact proofs, performs fast verification, and has mature tooling through SnarkJS and Circom. A browser can generate a witness and proof with the compiled WebAssembly and a proving key, while a Next.js server can verify the small proof and public inputs with a verification key. Groth16 also integrates naturally with a Circom 2.0 circuit and a BN128 trusted setup. The trade-off is that Groth16 requires circuit-specific setup parameters, unlike universal or updating systems. That is acceptable for this isolated, fixed age-verification circuit if the trusted setup is performed securely and the resulting proving key and verification key are matched to the compiled R1CS.

## LessThan and the Age Comparison

The circuit uses `LessThan(64)` from circomlib to compare unsigned 64-bit values. In mathematical terms, `LessThan(n).in[0] < LessThan(n).in[1]` produces output `1` when the first input is less than the second input and `0` otherwise. The circuit first computes `age = currentYear - birthYear`. It then asks the component whether `age` is less than `minAge`. The circuit constrains the component's output to be `0`; therefore, `age` cannot be less than `minAge`, which proves `age >= minAge`. This comparison is encoded as a rank-1 constraint system by Circom and Groth16, rather than being a normal JavaScript-style conditional.

## Range Checks and Invalid Inputs

The `Num2Bits(64)` range check decomposes `birthYear` into 64 binary digits. This constrains the private witness to a non-negative value representable in 64 bits, preventing field wrapping from turning a negative input into an apparently valid positive value. In addition, the circuit rejects years below 1900. The floor is deliberately conservative and separates a likely impossible or absurdly old birth year from valid users. It can be adjusted after discussion if the application has a different minimum date requirement.

A second comparison rejects a birth year later than `currentYear`, preventing negative ages. Together, the binary range check, the 1900 floor, and the future-year check establish that `birthYear` is within a sensible range and that subtracting it from `currentYear` produces a meaningful, non-negative age. These constraints do not reveal the birth year to a verifier.

## Zero-Knowledge and Public Information

Zero-knowledge is achieved by keeping `birthYear` as a private circuit input and declaring only `currentYear` and `minAge` as public inputs. The verifier receives the Groth16 proof and public inputs, but not the witness containing the birth year or the internal `age` signal unless the circuit itself exposes it. Groth16 proves knowledge of a private witness satisfying the R1CS constraints. The 1900 and future-year range constraints and the age comparison are satisfied inside the proof. A valid proof therefore demonstrates both that the age calculation was performed correctly and that the resulting age is at least `minAge`.

The proof is valid only for a statement tied to the public current year and minimum age, preventing the server from accidentally accepting proof data generated for unrelated values. The verification key is public, but the proving key should be controlled according to the project's trusted setup policy because it is used to create proofs. In the server-side verification flow, only a boolean result is needed: SnarkJS verifies the proof against the public signals and verification key, and no birth-year witness is sent over the network.
