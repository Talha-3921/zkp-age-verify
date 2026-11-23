# Compiled Circuit Artifacts

This folder holds the compiled Circom artifacts generated for the age-verification circuit:

- `AgeVerify.r1cs`
- `AgeVerify.wasm`
- `AgeVerify.sym`
- `AgeVerify.zkey`
- `pot14_0000.ptau`, `pot14_0001.ptau`, and `pot14_final.ptau` when a local Powers of Tau setup is performed

The trusted setup also exports `AgeVerify_js/` witness-generation files and `verification_key.json`, although the verification key belongs in the repository's `keys/` folder for server use.

Run the following commands from the repository root after installing Circom and SnarkJS:

```bash
circom circom/AgeVerify.circom --r1cs --wasm --sym -o circuits

snarkjs powersoftau new bn128 14 circuits/pot14_0000.ptau -v
snarkjs powersoftau contribute circuits/pot14_0000.ptau circuits/pot14_0001.ptau --name="Wajid trusted setup contribution" -v
snarkjs powersoftau prepare phase2 circuits/pot14_0001.ptau circuits/pot14_final.ptau -v

snarkjs groth16 setup circuits/AgeVerify.r1cs circuits/pot14_final.ptau circuits/AgeVerify.zkey
snarkjs zkey contribute circuits/AgeVerify.zkey circuits/AgeVerify_final.zkey --name="Wajid zkey contribution" -v
snarkjs zkey export verificationkey circuits/AgeVerify_final.zkey keys/verification_key.json
```
