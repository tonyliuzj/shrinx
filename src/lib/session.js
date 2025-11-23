import { withIronSession } from "next-iron-session";

const sessionOptions = {
  password: process.env.SESSION_PASSWORD || "complex_password_at_least_32_characters_long",
  cookieName: "shrinx_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function withSessionRoute(handler) {
  return withIronSession(handler, sessionOptions);
}

export function withSessionSsr(handler) {
  return withIronSession(handler, sessionOptions);
}
