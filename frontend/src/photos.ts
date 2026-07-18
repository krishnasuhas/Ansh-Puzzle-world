// Built-in baby photos of Ansh — the real gift photos.
import type { ImageSourcePropType } from "react-native";

export type BuiltInPhoto = {
  id: string;
  label: string;
  source: ImageSourcePropType;
};

export const ANSH_PHOTOS: BuiltInPhoto[] = [
  { id: "ansh_1", label: "Ansh 1", source: require("../assets/puzzle_photos/ansh_1.jpg") },
  { id: "ansh_2", label: "Ansh 2", source: require("../assets/puzzle_photos/ansh_2.jpg") },
  { id: "ansh_3", label: "Ansh 3", source: require("../assets/puzzle_photos/ansh_3.jpg") },
  { id: "ansh_4", label: "Ansh 4", source: require("../assets/puzzle_photos/ansh_4.jpg") },
  { id: "ansh_5", label: "Ansh 5", source: require("../assets/puzzle_photos/ansh_5.jpg") },
];

export function getPhotoSource(
  photoId: string,
  photoUri?: string,
): ImageSourcePropType {
  if (photoUri) return { uri: photoUri };
  const found = ANSH_PHOTOS.find((p) => p.id === photoId);
  return found ? found.source : ANSH_PHOTOS[0].source;
}
