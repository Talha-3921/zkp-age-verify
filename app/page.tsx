"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Proof = object | null;

export default function Home() {
  const [birthYear, setBirthYear] = useState<number>(1981);
  const [minAge, setMinAge] = useState<number>(21);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [credentialIssued, setCredentialIssued] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [proof, setProof] = useState<Proof>(null);
  const [publicSignals, setPublicSignals] = useState<string[] | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [frameScale, setFrameScale] = useState<number>(1);
  const verificationStarted = useRef(false);

  useEffect(() => {
    const updateFrameScale = () => {
      setFrameScale(
        Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
      );
    };

    updateFrameScale();
    window.addEventListener("resize", updateFrameScale);
    return () => window.removeEventListener("resize", updateFrameScale);
  }, []);

  useEffect(() => {
    if (currentStep !== 3 || proof === null) return;
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    if (isSimulated) {
      setVerificationResult(true);
      setErrorMessage(null);
      return;
    }

    const verifyProof = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proof, publicSignals }),
        });
        const data = (await response.json()) as {
          verified?: boolean;
          simulated?: boolean;
        };
        if (data.simulated) {
          setIsSimulated(true);
        }
        setVerificationResult(data.verified === true);
        setErrorMessage(
          data.verified === true ? null : "Proof verification failed"
        );
      } catch {
        setVerificationResult(false);
        setErrorMessage("Server error — please try again");
      } finally {
        setIsLoading(false);
      }
    };

    void verifyProof();
  }, [currentStep, proof, publicSignals, isSimulated]);

  const issueCredential = () => {
    setCredentialIssued(true);
    setErrorMessage(null);
    setSuccessMessage(`Credential issued for birth year ${birthYear}`);
    window.setTimeout(() => {
      setSuccessMessage(null);
      setCurrentStep(2);
    }, 1000);
  };

  const generateProof = async () => {
    if (!credentialIssued) {
      setErrorMessage("Please issue a credential first");
      return;
    }

    const age = 2026 - birthYear;
    if (
      birthYear < 1900 ||
      birthYear > 2026 ||
      !Number.isInteger(birthYear) ||
      !Number.isInteger(minAge) ||
      minAge < 0 ||
      age < minAge
    ) {
      setProof(null);
      setPublicSignals(null);
      setIsSimulated(false);
      setVerificationResult(false);
      setErrorMessage(null);
      setIsLoading(false);
      verificationStarted.current = true;
      setCurrentStep(3);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setVerificationResult(null);
    verificationStarted.current = false;

    try {
      const snarkjs = await import("snarkjs");
      const result = await snarkjs.groth16.fullProve(
        { birthYear, currentYear: 2026, minAge },
        "/circuits/AgeVerify_js/AgeVerify.wasm",
        "/circuits/AgeVerify_0001.zkey"
      );
      if (
        typeof result.proof !== "object" ||
        result.proof === null ||
        !Array.isArray(result.publicSignals) ||
        !result.publicSignals.every(
          (signal) => typeof signal === "string" || typeof signal === "number"
        )
      ) {
        throw new Error("Invalid proof result");
      }
      setProof(result.proof);
      setPublicSignals(
        result.publicSignals.map((signal) => String(signal))
      );
      setIsSimulated(false);
    } catch (error) {
      const detail = String(error);
      const missingCircuitArtifact =
        /404|not found|failed to fetch|networkerror|wasm|zkey/i.test(detail);

      if (missingCircuitArtifact) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setProof({
          simulated: true,
          pi_a: ["0", "0"],
          pi_b: [
            ["0", "0"],
            ["0", "0"],
          ],
          pi_c: ["0", "0"],
        });
        setPublicSignals(["2026", String(minAge)]);
        setIsSimulated(true);
      } else {
        setProof(null);
        setPublicSignals(null);
        setIsSimulated(false);
        setVerificationResult(false);
        setErrorMessage(null);
        setIsLoading(false);
        verificationStarted.current = true;
        setCurrentStep(3);
        return;
      }
    } finally {
      setIsLoading(false);
      setCurrentStep(3);
    }
  };

  const switchStep = (step: number) => {
    setErrorMessage(null);
    setCurrentStep(step);
  };

  const resultText =
    verificationResult === true ? "PASS" : verificationResult === false ? "FAIL" : "";

  const tabs = [
    { step: 1, label: "Step 1" },
    { step: 2, label: "Step 2" },
    { step: 3, label: "Step 3" },
  ];

  return (
    <main
      className="zkp-page"
      style={{
        position: "fixed",
        inset: 0,
        margin: 0,
        background: "#101010",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400&family=Roboto+Mono:wght@400&family=BBH+Hegarty&display=swap');

        .zkp-frame {
          width: 1920px;
          height: 1080px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scale(var(--zkp-scale, 1));
          transform-origin: center;
          z-index: 1;
          background: transparent;
          overflow: hidden;
        }

        .zkp-watermark {
          position: fixed;
          inset: -2000px;
          width: auto;
          height: auto;
          pointer-events: none;
          user-select: none;
          z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='270' viewBox='0 0 720 270'%3E%3Cg fill='rgba(217,217,217,0.055)' font-family='Arial Black,Arial,sans-serif' font-size='70' font-weight='900' text-anchor='middle'%3E%3Ctext x='360' y='63'%3EZERO%3C/text%3E%3Ctext x='360' y='126'%3EKNOWLEDGE%3C/text%3E%3Ctext x='360' y='189'%3EPROOF%3C/text%3E%3C/g%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 500px 270px;
          background-position: center;
        }

        .zkp-year-input::placeholder,
        .zkp-age-input::placeholder {
          color: rgba(255, 255, 255, 0.28);
          opacity: 1;
        }

        .zkp-fade {
          animation: zkp-fade-in 280ms ease-out;
        }

        @keyframes zkp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .zkp-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(112,40,171,0.25);
          border-top-color: #7028ab;
          border-radius: 50%;
          animation: zkp-spin 700ms linear infinite;
        }

        @keyframes zkp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="zkp-watermark"
      />

      <div
        className="zkp-frame"
        style={
          {
            "--zkp-scale": frameScale,
          } as CSSProperties
        }
      >

        <nav
          style={{
            position: "absolute",
            zIndex: 2,
            left: 671.9999694824219,
            top: 80,
            width: 577,
            height: 71,
            borderRadius: 32,
            background: "rgba(32,32,32,0.79)",
          }}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.step}
              type="button"
              onClick={() => switchStep(tab.step)}
              style={{
                position: "absolute",
                left: index === 0 ? 11 : index === 1 ? 216 : 420,
                top: 9,
                width: index === 2 ? 146 : 145,
                height: 53,
                borderRadius: 32,
                border: 0,
                background: currentStep === tab.step ? "#7028ab" : "#161616",
                color: currentStep === tab.step ? "#ffffff" : "#999999",
                fontFamily: "Poppins, sans-serif",
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "30px",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {currentStep === 1 && (
          <section
            key="step-1"
            className="zkp-fade"
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
          >
            <div
              style={{
                position: "absolute",
                left: 846,
                top: 386,
                width: 228,
                height: 30,
                textAlign: "center",
                color: "#ee8916",
                fontFamily: "Poppins, sans-serif",
                fontSize: 24,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              *SERVER OPERATION
            </div>

            <div
              style={{
                position: "absolute",
                left: 578,
                top: 444,
                width: 764,
                height: 192,
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 53,
                background:
                  "linear-gradient(90deg, #252525 0%, rgba(37,37,37,0.36) 100%)",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="zkp-spinner" />
                </div>
              ) : (
                <input
                  className="zkp-year-input"
                  aria-label="Birth Year"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="1981"
                  value={birthYear === 0 ? "" : String(birthYear)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    setBirthYear(digits === "" ? 0 : Number(digits));
                  }}
                  style={{
                    position: "absolute",
                    left: 30,
                    top: 0,
                    width: 704,
                    height: 192,
                    border: 0,
                    outline: "none",
                    background: "transparent",
                    color: "#ffffff",
                    fontFamily: "'BBH Hegarty', 'Arial Black', sans-serif",
                    fontSize: 160,
                    fontWeight: 400,
                    lineHeight: "162px",
                    textAlign: "center",
                    padding: 0,
                    appearance: "none",
                  }}
                />
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 858,
                top: 684,
                width: 204,
                height: 30,
                textAlign: "center",
                color: "#7028ab",
                fontFamily: "Poppins, sans-serif",
                fontSize: 36,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              Birth Year
            </div>

            <div
              style={{
                position: "absolute",
                left: 661,
                top: 752,
                width: 599,
                height: 30,
                textAlign: "center",
                color: "#999999",
                fontFamily: "Poppins, sans-serif",
                fontSize: 20,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              Private input — stays in your browser, never sent to the serve
            </div>

            <button
              type="button"
              onClick={issueCredential}
              style={{
                position: "absolute",
                left: 791,
                top: 918,
                width: 339,
                height: 82,
                borderRadius: 53,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "#161616",
                color: "#ffffff",
                fontFamily: "Poppins, sans-serif",
                fontSize: 24,
                fontWeight: 400,
                lineHeight: "30px",
                cursor: "pointer",
              }}
            >
              Issue Credential
            </button>

            {(errorMessage || successMessage) && (
              <div
                style={{
                  position: "absolute",
                  left: 660,
                  top: 1010,
                  width: 600,
                  textAlign: "center",
                  color: errorMessage ? "#ff4d4d" : "#7028ab",
                  fontFamily: "Roboto Mono, monospace",
                  fontSize: 16,
                  lineHeight: "24px",
                }}
              >
                {errorMessage ?? successMessage}
              </div>
            )}
          </section>
        )}

        {currentStep === 2 && (
          <section
            key="step-2"
            className="zkp-fade"
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
          >
            <div
              style={{
                position: "absolute",
                left: 798,
                top: 386,
                width: 324,
                height: 30,
                textAlign: "center",
                color: "#ee8916",
                fontFamily: "Poppins, sans-serif",
                fontSize: 24,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              *CLIENT-SIDE COMPUTATION
            </div>

            <div
              style={{
                position: "absolute",
                left: 759,
                top: 444,
                width: 403,
                height: 192,
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 53,
                background:
                  "linear-gradient(90deg, #252525 0%, rgba(37,37,37,0.36) 100%)",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="zkp-spinner" />
                </div>
              ) : (
                <input
                  className="zkp-age-input"
                  aria-label="Minimum Age Required"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="21"
                  value={minAge === 0 ? "" : String(minAge)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    setMinAge(digits === "" ? 0 : Number(digits));
                  }}
                  style={{
                    position: "absolute",
                    left: 30,
                    top: 0,
                    width: 343,
                    height: 192,
                    border: 0,
                    outline: "none",
                    background: "transparent",
                    color: "#ffffff",
                    fontFamily: "'BBH Hegarty', 'Arial Black', sans-serif",
                    fontSize: 160,
                    fontWeight: 400,
                    lineHeight: "162px",
                    textAlign: "center",
                    padding: 0,
                    appearance: "none",
                  }}
                />
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 755,
                top: 682,
                width: 416,
                height: 30,
                textAlign: "center",
                color: "#7028ab",
                fontFamily: "Poppins, sans-serif",
                fontSize: 36,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              Minimum Age Required
            </div>

            <div
              style={{
                position: "absolute",
                left: 636,
                top: 752,
                width: 649,
                height: 30,
                textAlign: "center",
                color: "#999999",
                fontFamily: "Roboto Mono, monospace",
                fontSize: 20,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              Public input — this value is sent to the server openly
            </div>

            <button
              type="button"
              onClick={() => void generateProof()}
              disabled={isLoading}
              style={{
                position: "absolute",
                left: 791,
                top: 918,
                width: 339,
                height: 82,
                borderRadius: 53,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "#161616",
                color: "#ffffff",
                fontFamily: "Poppins, sans-serif",
                fontSize: 24,
                fontWeight: 400,
                lineHeight: "30px",
                cursor: isLoading ? "wait" : "pointer",
              }}
            >
              Generate Proof
            </button>

            {errorMessage && (
              <div
                style={{
                  position: "absolute",
                  left: 660,
                  top: 1010,
                  width: 600,
                  textAlign: "center",
                  color: "#ff4d4d",
                  fontFamily: "Roboto Mono, monospace",
                  fontSize: 16,
                  lineHeight: "24px",
                }}
              >
                {errorMessage}
              </div>
            )}
          </section>
        )}

        {currentStep === 3 && (
          <section
            key="step-3"
            className="zkp-fade"
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
          >
            <div
              style={{
                position: "absolute",
                left: 833,
                top: 386,
                width: 254,
                height: 30,
                textAlign: "center",
                color: "#ee8916",
                fontFamily: "Poppins, sans-serif",
                fontSize: 24,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              *SERVER VERIFICATION
            </div>

            <div
              style={{
                position: "absolute",
                left: 633,
                top: 444,
                width: 655,
                height: 192,
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 53,
                background:
                  "linear-gradient(90deg, #252525 0%, rgba(37,37,37,0.36) 100%)",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="zkp-spinner" />
                </div>
              ) : (
                verificationResult !== null && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: verificationResult ? "#ffffff" : "#ff4d4d",
                      fontFamily:
                        "'BBH Hegarty', 'Arial Black', sans-serif",
                      fontSize: 160,
                      fontWeight: 400,
                      lineHeight: "162px",
                    }}
                  >
                    {resultText}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: 800,
                top: 684,
                width: 321,
                height: 30,
                textAlign: "center",
                color: "#7028ab",
                fontFamily: "Poppins, sans-serif",
                fontSize: 36,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              Verification Result
            </div>

            <div
              style={{
                position: "absolute",
                left: 528,
                top: 752,
                width: 865,
                height: 60,
                textAlign: "center",
                color: "#999999",
                fontFamily: "Roboto Mono, monospace",
                fontSize: 20,
                fontWeight: 400,
                lineHeight: "30px",
                whiteSpace: "nowrap",
              }}
            >
              <div>
                {isSimulated
                  ? `Demo result: age ≥ ${minAge} without a real proof`
                  : verificationResult === true
                    ? `Server confirmed age ≥ ${minAge} without learning the birth year`
                    : verificationResult === false
                      ? `The circuit result did not satisfy age ≥ ${minAge}`
                      : "Waiting for proof verification"}
              </div>
              <div style={{ color: isSimulated ? "#999999" : "#ee8916" }}>
                {isSimulated
                  ? "No proof was sent to the verification server."
                  : "Only the proof was sent. The birth year remained private in the browser."}
              </div>
              {isSimulated && (
                <div style={{ color: "#999999" }}>
                  Circuit files not compiled yet — running in demo mode
                </div>
              )}
            </div>

            {errorMessage && (
              <div
                style={{
                  position: "absolute",
                  left: 660,
                  top: 1010,
                  width: 600,
                  textAlign: "center",
                  color: "#ff4d4d",
                  fontFamily: "Roboto Mono, monospace",
                  fontSize: 16,
                  lineHeight: "24px",
                }}
              >
                {errorMessage}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
