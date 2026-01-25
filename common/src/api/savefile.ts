import Type, { Static } from "typebox";

export const SaveStateSchema = Type.Object({
    cells: Type.Array(Type.Number()),
    elapsed: Type.Number()
});

export const SaveFileEntrySchema = Type.Object({
    nonogramId: Type.String(),
    state: SaveStateSchema
});

export const SaveFileSchema = Type.Object({
    versionKey: Type.Number(),
    lastPlayedNonogramId: Type.Optional(Type.String()),
    entries: Type.Array(SaveFileEntrySchema)
});

export type SaveFile = Static<typeof SaveFileSchema>
export type SaveFileEntry = Static<typeof SaveFileEntrySchema>
export type SaveState = Static<typeof SaveStateSchema>


