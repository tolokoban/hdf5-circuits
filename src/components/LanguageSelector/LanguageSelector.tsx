import React from "react";

import { useLang } from "@/lang";

import EnglishFlagURL from "./en.png";
import FrenchFlagURL from "./fr.png";

import Styles from "./LanguageSelector.module.css";

export interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className }: LanguageSelectorProps) {
  const [lang, setLang] = useLang();
  return (
    <div className={join(className, Styles.languageselector)}>
      {["en", "fr"].map((key) => (
        <button
          className={join(lang.startsWith(key) && Styles.current)}
          key={key}
          type="button"
          onClick={() => setLang(key)}
        >
          <img src={key === "fr" ? FrenchFlagURL : EnglishFlagURL} />
        </button>
      ))}
    </div>
  );
}

function join(...classes: unknown[]): string {
  return classes.filter((cls) => typeof cls === "string").join(" ");
}
