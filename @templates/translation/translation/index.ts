import { useTanslationGeneric } from "@/lang";
import EN from "./en";

export function useTranslation() {
  return useTanslationGeneric(EN, { fr: () => import("./fr") });
}
