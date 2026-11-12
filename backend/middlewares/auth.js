import jwt from "jsonwebtoken";
export function authenticate(req, res, next) {
  const match = req.headers.authorization?.match(/^Bearer (.+)$/);
  if (!match)
    return res
      .status(401)
      .json({ message: "Entre na sua conta para continuar." });
  try {
    req.userId = Number(
      jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ["HS256"] })
        .sub,
    );
    next();
  } catch {
    res.status(401).json({ message: "Sessão expirada. Entre novamente." });
  }
}
