import axios from "axios";

export async function verifyTurnstileToken({ secretKey, response }) {
  const params = new URLSearchParams();
  params.append("secret", secretKey);
  params.append("response", response);

  try {
    const verifyRes = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!verifyRes.data.success) {
      return {
        ok: false,
        message: "Captcha verification failed.",
        errors: verifyRes.data["error-codes"] || [],
      };
    }

    return { ok: true, errors: [] };
  } catch (error) {
    return {
      ok: false,
      message: "Error verifying captcha.",
      errors: error.response?.data?.["error-codes"] || [],
    };
  }
}
