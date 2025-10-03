"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import ReactCountryFlag from "react-country-flag";

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  // ustal, jaki język ma być następny
  const next = currentLocale === "en" ? "pl" : "en";

  const handleLocaleSwitch = () => {
    router.replace(pathname, { locale: next });
  };

  const getFlag = (locale: string) => {
    switch (locale) {
      case "en":
        return (
          <ReactCountryFlag
            countryCode="GB" // albo "US" jeśli wolisz
            svg
            style={{ width: "1.5em", height: "1.5em" }}
            title="English"
          />
        );
      case "pl":
        return (
          <ReactCountryFlag
            countryCode="PL"
            svg
            style={{ width: "1.5em", height: "1.5em" }}
            title="Polski"
          />
        );
      default:
        return null;
    }
  };

  return (
    <button
      className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-gray-100 transition"
      onClick={handleLocaleSwitch}
    >
      {/* aktualny język */}
      <span className="flex items-center gap-1">
        {getFlag(currentLocale)} {currentLocale.toUpperCase()}
      </span>
     
    </button>
  );
}
