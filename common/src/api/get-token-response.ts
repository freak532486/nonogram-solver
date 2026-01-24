import { Static, Type } from "typebox";

export const GetTokenResponseSchema = Type.Object({
    sessionToken: Type.String(),
    refreshToken: Type.String()
});

export type GetTokenResponse = Static<typeof GetTokenResponseSchema>;